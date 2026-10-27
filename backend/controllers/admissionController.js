import nodemailer from 'nodemailer';
import fs from 'fs';
import Admission from '../models/Admission.js';
import Student from '../models/Student.js';

// Controller to check for duplicates before/during form submission
export const checkDuplicateAdmission = async (req, res) => {
    try {
        const { cnic, number } = req.query;

        if (!cnic && !number) {
            return res.status(400).json({ success: false, message: 'Please provide CNIC or Phone Number to check.' });
        }

        const cleanCnic = cnic ? cnic.trim() : '';
        const cleanNumber = number ? number.trim() : '';

        // Check in Admission collection
        if (cleanCnic) {
            const existingAdmissionByCnic = await Admission.findOne({ cnic: cleanCnic });
            const existingStudentByCnic = await Student.findOne({ cnic: cleanCnic });
            if (existingAdmissionByCnic || existingStudentByCnic) {
                return res.status(200).json({
                    isDuplicate: true,
                    field: 'cnic',
                    message: `An application or registered student with CNIC (${cleanCnic}) already exists!`,
                });
            }
        }

        if (cleanNumber) {
            const existingAdmissionByPhone = await Admission.findOne({
                $or: [{ number: cleanNumber }, { fatherPhone: cleanNumber }, { husbandPhone: cleanNumber }],
            });
            const existingStudentByPhone = await Student.findOne({ phone: cleanNumber });
            if (existingAdmissionByPhone || existingStudentByPhone) {
                return res.status(200).json({
                    isDuplicate: true,
                    field: 'number',
                    message: `An application or registered student with Phone Number (${cleanNumber}) already exists!`,
                });
            }
        }

        return res.status(200).json({ isDuplicate: false, message: 'No duplicate found.' });
    } catch (error) {
        console.error('Error checking duplicate:', error);
        return res.status(500).json({ success: false, message: 'Error checking duplicate record.' });
    }
};

export const submitAdmission = async (req, res) => {
    try {
        const {
            name,
            fatherName,
            qualification,
            cnic,
            country,
            city,
            number,
            dob,
            nationality,
            religion,
            maritalStatus,
            fatherPhone,
            husbandPhone,
            course,
            enrollmentPlan,
            programs,
        } = req.body;

        if (!name || !fatherName || !qualification || !cnic || !country || !city || !number) {
            return res.status(400).json({ success: false, message: 'Please fill in all required text fields.' });
        }

        // Duplicate Check in DB
        const cleanCnic = cnic.trim();
        const cleanNumber = number.trim();

        const duplicateCnic = await Admission.findOne({ cnic: cleanCnic }) || await Student.findOne({ cnic: cleanCnic });
        if (duplicateCnic) {
            return res.status(400).json({
                success: false,
                message: `Duplicate Error: An application with CNIC/ID (${cleanCnic}) is already registered.`,
            });
        }

        const duplicatePhone = await Admission.findOne({
            $or: [{ number: cleanNumber }, { fatherPhone: cleanNumber }, { husbandPhone: cleanNumber }],
        }) || await Student.findOne({ phone: cleanNumber });
        if (duplicatePhone) {
            return res.status(400).json({
                success: false,
                message: `Duplicate Error: An application with Phone Number (${cleanNumber}) is already registered.`,
            });
        }

        // Verify that files exist
        if (!req.files || !req.files.documentFile || !req.files.passportPhoto || !req.files.cnicPhoto) {
            return res.status(400).json({
                success: false,
                message: 'All three attachments (CNIC Card, Passport Image, and Documents PDF) are required.',
            });
        }

        const documentFile = req.files.documentFile[0];
        const passportPhoto = req.files.passportPhoto[0];
        const cnicPhoto = req.files.cnicPhoto[0];

        // Format selected programs
        let programsList = 'None selected';
        let parsedPrograms = [];
        if (programs) {
            if (Array.isArray(programs)) {
                parsedPrograms = programs;
                programsList = programs.join(', ');
            } else {
                parsedPrograms = [programs];
                programsList = programs;
            }
        }

        // Construct file URLs
        const fileUrls = {
            documentFile: `${req.protocol}://${req.get('host')}/uploads/${documentFile.filename}`,
            passportPhoto: `${req.protocol}://${req.get('host')}/uploads/${passportPhoto.filename}`,
            cnicPhoto: `${req.protocol}://${req.get('host')}/uploads/${cnicPhoto.filename}`,
        };

        // Save Admission to Database
        try {
            const newAdmission = new Admission({
                name,
                fatherName,
                dob: dob || '',
                cnic: cleanCnic,
                country,
                city,
                nationality: nationality || '',
                religion: religion || 'Islam',
                maritalStatus: maritalStatus || 'Single',
                qualification,
                number: cleanNumber,
                fatherPhone: fatherPhone || '',
                husbandPhone: husbandPhone || '',
                course: course || '',
                enrollmentPlan: enrollmentPlan || '',
                programs: parsedPrograms,
                fileUrls,
                status: 'Pending',
            });
            await newAdmission.save();
        } catch (dbErr) {
            console.error('Failed to save admission to MongoDB:', dbErr);
        }

        const htmlContent = `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 650px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
                <div style="background-color: #059669; color: white; padding: 24px; text-align: center;">
                    <h2 style="margin: 0; font-size: 20px;">New Online Admission Form</h2>
                    <p style="margin: 4px 0 0 0; font-size: 14px; opacity: 0.9;">Khadeeja Tul Kubra Islamic Institute</p>
                </div>
                
                <div style="padding: 24px; background-color: #ffffff;">
                    <h3 style="border-bottom: 1px solid #f1f5f9; padding-bottom: 8px; color: #1e293b; font-size: 16px; margin-top: 0;">Student Personal Details</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold; color: #475569; width: 180px;">Full Name:</td>
                            <td style="padding: 8px 0; color: #0f172a;">${name}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold; color: #475569;">Father's Name:</td>
                            <td style="padding: 8px 0; color: #0f172a;">${fatherName}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold; color: #475569;">Date of Birth:</td>
                            <td style="padding: 8px 0; color: #0f172a;">${dob || 'N/A'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold; color: #475569;">CNIC / National ID:</td>
                            <td style="padding: 8px 0; color: #0f172a;">${cnic}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold; color: #475569;">Nationality:</td>
                            <td style="padding: 8px 0; color: #0f172a;">${nationality || 'N/A'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold; color: #475569;">Religion:</td>
                            <td style="padding: 8px 0; color: #0f172a;">${religion || 'N/A'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold; color: #475569;">Marital Status:</td>
                            <td style="padding: 8px 0; color: #0f172a;">${maritalStatus || 'N/A'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold; color: #475569;">Qualification:</td>
                            <td style="padding: 8px 0; color: #0f172a;">${qualification}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold; color: #475569;">Country:</td>
                            <td style="padding: 8px 0; color: #0f172a;">${country}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold; color: #475569;">City:</td>
                            <td style="padding: 8px 0; color: #0f172a;">${city}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold; color: #475569;">Applicant Phone:</td>
                            <td style="padding: 8px 0; color: #0f172a;">${number}</td>
                        </tr>
                        ${fatherPhone ? `
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold; color: #475569;">Father's Phone:</td>
                            <td style="padding: 8px 0; color: #0f172a;">${fatherPhone}</td>
                        </tr>` : ''}
                        ${husbandPhone ? `
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold; color: #475569;">Husband's Phone:</td>
                            <td style="padding: 8px 0; color: #0f172a;">${husbandPhone}</td>
                        </tr>` : ''}
                    </table>

                    <h3 style="border-bottom: 1px solid #f1f5f9; padding-bottom: 8px; color: #1e293b; font-size: 16px; margin-top: 24px;">Enrollment & Program Details</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        ${course ? `
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold; color: #475569; width: 180px;">Selected Course:</td>
                            <td style="padding: 8px 0; color: #0f172a; font-weight: bold;">${course}</td>
                        </tr>` : ''}
                        ${enrollmentPlan ? `
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold; color: #475569;">Enrollment Plan:</td>
                            <td style="padding: 8px 0; color: #0f172a; font-weight: bold;">${enrollmentPlan}</td>
                        </tr>` : ''}
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold; color: #475569;">Programs:</td>
                            <td style="padding: 8px 0; color: #0f172a;">${programsList}</td>
                        </tr>
                    </table>

                    <h3 style="border-bottom: 1px solid #f1f5f9; padding-bottom: 8px; color: #1e293b; font-size: 16px; margin-top: 24px;">Uploaded Files</h3>
                    <p style="margin: 8px 0 0 0; font-size: 14px; line-height: 1.8;">
                        <strong>1. CNIC Front & Back:</strong> <a href="${fileUrls.cnicPhoto}" target="_blank">${fileUrls.cnicPhoto}</a><br/>
                        <strong>2. Passport Photo:</strong> <a href="${fileUrls.passportPhoto}" target="_blank">${fileUrls.passportPhoto}</a><br/>
                        <strong>3. Educational Document:</strong> <a href="${fileUrls.documentFile}" target="_blank">${fileUrls.documentFile}</a>
                    </p>
                </div>
            </div>
        `;

        if (process.env.BREVO_API_KEY) {
            console.log("Sending admission email asynchronously via Brevo API...");
            
            // Build base64 attachments for Brevo (works both locally and in production)
            const attachments = [];
            const readAsAttachment = (file) => {
                if (!file) return null;
                try {
                    if (file.path && fs.existsSync(file.path)) {
                        return {
                            content: fs.readFileSync(file.path).toString('base64'),
                            name: file.originalname,
                        };
                    } else if (file.buffer) {
                        return {
                            content: file.buffer.toString('base64'),
                            name: file.originalname,
                        };
                    }
                } catch (err) {
                    console.error(`Error preparing attachment for ${file.originalname}:`, err);
                }
                return null;
            };

            const cnicAtt = readAsAttachment(cnicPhoto);
            if (cnicAtt) attachments.push(cnicAtt);
            const passAtt = readAsAttachment(passportPhoto);
            if (passAtt) attachments.push(passAtt);
            const docAtt = readAsAttachment(documentFile);
            if (docAtt) attachments.push(docAtt);

            fetch('https://api.brevo.com/v3/smtp/email', {
                method: 'POST',
                headers: {
                    'accept': 'application/json',
                    'api-key': process.env.BREVO_API_KEY,
                    'content-type': 'application/json',
                },
                body: JSON.stringify({
                    sender: { name: "Admission Portal", email: process.env.SMTP_USER || "admission@ktkislamic.org" },
                    to: [{ email: process.env.SMTP_TO || "islamicinstitutekhadeejatulkub@gmail.com" }],
                    subject: `Admission Form Submission: ${name} (${cleanCnic})`,
                    htmlContent: htmlContent,
                    attachment: attachments.length > 0 ? attachments : undefined,
                }),
            })
            .then(res => res.json())
            .then(resData => {
                console.log("Brevo API Response:", resData);
            })
            .catch(apiErr => {
                console.error("Brevo API Transmission Failed:", apiErr);
            });
        } else if (process.env.SMTP_USER && process.env.SMTP_PASS && process.env.SMTP_PASS !== 'your_gmail_app_password_here') {
            try {
                const transporter = nodemailer.createTransport({
                    host: process.env.SMTP_HOST || 'smtp.gmail.com',
                    port: parseInt(process.env.SMTP_PORT) || 465,
                    secure: process.env.SMTP_SECURE !== 'false',
                    auth: {
                        user: process.env.SMTP_USER,
                        pass: process.env.SMTP_PASS,
                    },
                    family: 4,
                });

                const mailOptions = {
                    from: process.env.SMTP_FROM || `"Admission Portal" <${process.env.SMTP_USER}>`,
                    to: process.env.SMTP_TO || process.env.SMTP_USER || 'islamicinstitutekhadeejatulkub@gmail.com',
                    subject: `Admission Form Submission: ${name} (${cleanCnic})`,
                    html: htmlContent,
                    attachments: [
                        {
                            filename: cnicPhoto.originalname,
                            path: cnicPhoto.path,
                        },
                        {
                            filename: passportPhoto.originalname,
                            path: passportPhoto.path,
                        },
                        {
                            filename: documentFile.originalname,
                            path: documentFile.path,
                        },
                    ],
                };

                console.log("Sending admission email asynchronously to:", mailOptions.to);
                transporter.sendMail(mailOptions)
                    .then(info => {
                        console.log("Admission email sent successfully! MessageId:", info.messageId);
                    })
                    .catch(smtpErr => {
                        console.error("Nodemailer transmission failed:", smtpErr);
                    });
            } catch (smtpErr) {
                console.error("Nodemailer setup failed:", smtpErr);
            }
        } else {
            console.log("Neither SMTP nor Brevo configured, skipping email notification.");
        }

        // Return success response with URLs and details
        res.status(200).json({ 
            success: true, 
            message: 'Your admission form and files have been successfully uploaded!', 
            fileUrls,
            data: {
                name,
                fatherName,
                dob,
                cnic: cleanCnic,
                nationality,
                religion,
                maritalStatus,
                qualification,
                country,
                city,
                number: cleanNumber,
                fatherPhone,
                husbandPhone,
                course,
                enrollmentPlan,
                programs: programsList,
            },
        });
    } catch (error) {
        console.error('Admission Submission Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while processing admission details. Please try again later.',
            error: error.message,
        });
    }
};
