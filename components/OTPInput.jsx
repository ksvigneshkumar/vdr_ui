// // components/OTPInput.jsx
// 'use client';

// import { useRef, useState } from 'react';

// export default function OTPInput({ length = 6, onComplete, disabled = false }) {
//   const [otp, setOtp] = useState(new Array(length).fill(''));
//   const inputRefs = useRef([]);

//   const handleChange = (index, value) => {
//     const newOtp = [...otp];
    
//     if (/^[0-9]*$/.test(value)) {
//       newOtp[index] = value.slice(-1);
//       setOtp(newOtp);

//       if (value && index < length - 1) {
//         inputRefs.current[index + 1]?.focus();
//       }

//       if (newOtp.every(digit => digit !== '')) {
//         onComplete(newOtp.join(''));
//       }
//     }
//   };

//   const handleKeyDown = (index, e) => {
//     if (e.key === 'Backspace' && !otp[index] && index > 0) {
//       inputRefs.current[index - 1]?.focus();
//     }
//     if (e.key === 'ArrowLeft' && index > 0) {
//       inputRefs.current[index - 1]?.focus();
//     }
//     if (e.key === 'ArrowRight' && index < length - 1) {
//       inputRefs.current[index + 1]?.focus();
//     }
//   };

//   const handlePaste = (e) => {
//     e.preventDefault();
//     const pastedData = e.clipboardData.getData('text');
    
//     if (/^[0-9]*$/.test(pastedData) && pastedData.length === length) {
//       const newOtp = pastedData.split('');
//       setOtp(newOtp);
//       onComplete(pastedData);
//     }
//   };

//   return (
//     <div className="otp-input-container">
//       {otp.map((digit, index) => (
//         <input
//           key={index}
//           ref={(el) => (inputRefs.current[index] = el)}
//           type="text"
//           maxLength="1"
//           value={digit}
//           onChange={(e) => handleChange(index, e.target.value)}
//           onKeyDown={(e) => handleKeyDown(index, e)}
//           onPaste={handlePaste}
//           disabled={disabled}
//           className="otp-input"
//           placeholder="0"
//         />
//       ))}
//     </div>
//   );
// }