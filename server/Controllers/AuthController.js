const userModel = require("../Models/UserModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

const otpStorage = new Map();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Hàm tạo OTP ngẫu nhiên 6 số
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const register = async (req, res) => {
  try {
    const { userName, email, password } = req.body;

    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(400).send("Email đã được sử dụng");
    }

    await userModel.create({
      userName: userName,
      email: email,
      password: bcrypt.hashSync(password, 10),
      role: "user",
      status: "active",
      joinDate: new Date(),
    });

    return res.status(200).send("register");
  } catch (error) {
    console.log(error);
    return res.status(500).send("Lỗi server");
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await userModel.findOne({ email });
    if (!user) return res.status(400).send("invalid user");

    const validPass = bcrypt.compareSync(password, user.password);
    if (!validPass) return res.status(400).send("invalid password");

    const jwtToken = jwt.sign(
      {
        _id: user.id,
        username: user.userName,
        email: user.email,
        role: user.role,
        status: user.status,
      },
      process.env.SECRET_JWT,
      {
        expiresIn: "60m",
      }
    );

    return res.status(200).send({ accessToken: jwtToken });
  } catch (error) {
    console.log(error);
    return res.status(500).send("Lỗi server");
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(404).send("Email không tồn tại trong hệ thống");
    }

    const otp = generateOTP();

    otpStorage.set(email, {
      otp: otp,
      createdAt: Date.now(),
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 phút
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Mã OTP Đặt Lại Mật Khẩu",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #333; text-align: center;">Đặt Lại Mật Khẩu</h2>
            <p style="color: #666; font-size: 16px;">Xin chào <strong>${user.userName}</strong>,</p>
            <p style="color: #666; font-size: 16px;">Bạn đã yêu cầu đặt lại mật khẩu. Mã OTP của bạn là:</p>
            <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 5px; margin: 20px 0;">
              <h1 style="color: #007bff; font-size: 32px; letter-spacing: 5px; margin: 0;">${otp}</h1>
            </div>
            <p style="color: #666; font-size: 14px;">Mã OTP này có hiệu lực trong <strong>5 phút</strong>.</p>
            <p style="color: #666; font-size: 14px;">Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #999; font-size: 12px; text-align: center;">Email này được gửi tự động, vui lòng không trả lời.</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).send("Mã OTP đã được gửi đến email của bạn");
  } catch (error) {
    console.log("Forgot password error:", error);
    return res.status(500).send("Không thể gửi email. Vui lòng thử lại!");
  }
};

const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const otpData = otpStorage.get(email);

    if (!otpData) {
      return res.status(400).send("Mã OTP không hợp lệ hoặc đã hết hạn");
    }

    if (Date.now() > otpData.expiresAt) {
      otpStorage.delete(email);
      return res.status(400).send("Mã OTP đã hết hạn");
    }

    if (otpData.otp !== otp) {
      return res.status(400).send("Mã OTP không chính xác");
    }

    otpStorage.set(email, {
      ...otpData,
      verified: true,
    });

    return res.status(200).send("Xác thực OTP thành công");
  } catch (error) {
    console.log("Verify OTP error:", error);
    return res.status(500).send("Lỗi server");
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    const otpData = otpStorage.get(email);

    if (!otpData || !otpData.verified) {
      return res.status(400).send("Vui lòng xác thực OTP trước");
    }

    if (Date.now() > otpData.expiresAt) {
      otpStorage.delete(email);
      return res
        .status(400)
        .send("Phiên làm việc đã hết hạn. Vui lòng thử lại!");
    }

    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(404).send("User không tồn tại");
    }

    user.password = bcrypt.hashSync(newPassword, 10);
    await user.save();

    otpStorage.delete(email);

    return res.status(200).send("Đặt lại mật khẩu thành công");
  } catch (error) {
    console.log("Reset password error:", error);
    return res.status(500).send("Lỗi server");
  }
};

module.exports = {
  register,
  login,
  forgotPassword,
  verifyOTP,
  resetPassword,
};
