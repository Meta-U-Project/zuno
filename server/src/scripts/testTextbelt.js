const axios = require('axios');

/**
 * Simple script to test the TextBelt API directly
 * Run with: node src/scripts/testTextbelt.js
 */

async function testTextbelt() {
  try {
    // Phone number to send the SMS to (should be in E.164 format without the + sign)
    const phoneNumber = '17135848950'; // Replace with the user's phone number

    // Message to send
    const message = 'Zuno: This is a test message from TextBelt API. Reply STOP to opt-out.';

    // TextBelt API endpoint
    const textbeltUrl = 'https://textbelt.com/text';

    console.log(`Sending test SMS to ${phoneNumber}`);

    // Make a direct API call to TextBelt API
    const response = await axios.post(textbeltUrl, {
      phone: phoneNumber,
      message: message,
      key: '2ad4a5b9e3e0587ecfd44644f60bbf11c678604fM4oackH7WXY2MAEunpFAw7SzJ', // Your TextBelt API key
    });

    console.log('TextBelt API response:', response.data);

    if (response.data && response.data.success) {
      console.log('SMS sent successfully!');
      console.log('TextBelt quota remaining:', response.data.quotaRemaining);
      console.log('TextBelt message ID:', response.data.textId);
    } else {
      const errorText = response.data?.error || 'Unknown error';
      console.error(`SMS failed with error: ${errorText}`);
    }
  } catch (error) {
    console.error('Error sending SMS via TextBelt API:', error);
  }
}

testTextbelt();
