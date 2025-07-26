// Simple test to check if we can import the sendSmsNotification function
const textbeltService = require('../services/textbeltSmsService');

console.log('TextBelt Service:', textbeltService);
console.log('sendSmsNotification function:', textbeltService.sendSmsNotification);

if (typeof textbeltService.sendSmsNotification === 'function') {
  console.log('sendSmsNotification is a function - import successful!');
} else {
  console.error('sendSmsNotification is NOT a function - import failed!');
}
