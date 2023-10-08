const userFormData = {
  signInConfig: {
    buttonText: 'Sign In',
    inputs: [
      { type: 'text', name: 'email', label: 'Email', placeholder: 'Email' },
      { type: 'password', name: 'password', label: 'Password', placeholder: 'Password' },
    ],
  },
  signUpConfig: {
    buttonText: 'Sign Up',
    inputs: [
      { type: 'text', name: 'first_name', label: 'First Name' },
      { type: 'text', name: 'last_name', label: 'Last Name' },
      { type: 'text', name: 'email', label: 'Email', placeholder: 'Email' },
      { type: 'phone', name: 'phone', label: 'Phone Number', placeholder: 'Phone Number' },
      { type: 'password', name: 'password', label: 'Password', placeholder: 'Password' },
    ],
  },
};

export default userFormData;
