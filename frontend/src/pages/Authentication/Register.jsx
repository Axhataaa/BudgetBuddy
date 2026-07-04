import { useState } from "react";
import { registerUser } from "../../services/authService";

function Register() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    first_name: "",
    last_name: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
        const data = await registerUser(formData);
        alert("Registration Successful!");
        console.log(data);
    } catch (error) {
        console.log("Full Error:", error);
        console.log("Response:", error.response);
        console.log("Data:", error.response?.data);
        console.log("Status:", error.response?.status);

        if (error.response) {
        alert(JSON.stringify(error.response.data));
        } else {
        alert(error.message);
        }
    }
  };

  return (
    <div>
      <h2>Register</h2>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="username"
          placeholder="Username"
          onChange={handleChange}
        />

        <input
          type="email"
          name="email"
          placeholder="Email"
          onChange={handleChange}
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          onChange={handleChange}
        />

        <input
          type="text"
          name="first_name"
          placeholder="First Name"
          onChange={handleChange}
        />

        <input
          type="text"
          name="last_name"
          placeholder="Last Name"
          onChange={handleChange}
        />

        <button type="submit">Register</button>
      </form>
    </div>
  );
}

export default Register;