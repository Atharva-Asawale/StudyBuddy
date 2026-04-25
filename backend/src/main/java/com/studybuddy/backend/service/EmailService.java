package com.studybuddy.backend.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    public void sendOtpEmail(String toEmail, String otp, String userName) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setTo(toEmail);
            helper.setSubject("StudyBuddy — Your Password Reset OTP");

            String htmlContent = "<div style=\"font-family: 'Inter', Arial, sans-serif; background-color: #0a0a1a; padding: 40px 20px; color: #ffffff;\">"
                    + "<div style=\"max-width: 500px; margin: 0 auto; background-color: rgba(255, 255, 255, 0.05); padding: 30px; border-radius: 16px; border: 1px solid rgba(255, 255, 255, 0.1);\">"
                    + "<h2 style=\"color: #ffffff; text-align: center; margin-top: 0;\">Password Reset</h2>"
                    + "<p style=\"color: #a0a0b0; font-size: 16px; text-align: center;\">Hi " + (userName != null ? userName : "User") + ",</p>"
                    + "<p style=\"color: #a0a0b0; font-size: 16px; text-align: center;\">You requested a password reset. Here is your OTP:</p>"
                    + "<div style=\"background: linear-gradient(135deg, rgba(88, 101, 242, 0.2) 0%, rgba(138, 43, 226, 0.2) 100%); border: 1px solid rgba(88, 101, 242, 0.5); padding: 20px; border-radius: 12px; text-align: center; margin: 30px 0;\">"
                    + "<span style=\"font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #ffffff; margin-left: 8px;\">" + otp + "</span>"
                    + "</div>"
                    + "<p style=\"color: #a0a0b0; font-size: 14px; text-align: center;\">This OTP is valid for <strong>10 minutes</strong>.</p>"
                    + "<hr style=\"border: none; border-top: 1px solid rgba(255, 255, 255, 0.1); margin: 30px 0;\" />"
                    + "<p style=\"color: #a0a0b0; font-size: 12px; text-align: center; margin-bottom: 0;\">If you did not request this, ignore this email.</p>"
                    + "<p style=\"color: #a0a0b0; font-size: 14px; text-align: center; margin-top: 20px;\">Best regards,<br><strong>The StudyBuddy Team</strong></p>"
                    + "</div></div>";

            helper.setText(htmlContent, true);
            mailSender.send(message);

        } catch (MessagingException e) {
            throw new RuntimeException("Failed to send OTP email", e);
        }
    }
}
