import mongoose from "mongoose";
import bcrypt from "bcrypt";
const userSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  passwordHash: String,
  interests: [String]
});
userSchema.methods.setPassword = async function (pw) {
  this.passwordHash = await bcrypt.hash(pw, 10);
};
userSchema.methods.checkPassword = async function (pw) {
  return bcrypt.compare(pw, this.passwordHash);
};
export default mongoose.model("User", userSchema);
