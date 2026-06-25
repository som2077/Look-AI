const { Jimp } = require('jimp');

async function run() {
  try {
    const image = await Jimp.read('assets/android/playstore-icon.png');
    
    // Create a new 1080x1080 image with dark background
    // We will use the background color of the top-left pixel of the original image
    const hex = image.getPixelColor(0, 0);
    const padded = new Jimp({ width: 1080, height: 1080, color: hex });
    
    // Resize original to 720x720 (approx 66% to fit safely inside the adaptive circle)
    image.resize({ w: 720, h: 720 });
    
    // Composite the original onto the center of the padded image
    padded.composite(image, (1080 - 720) / 2, (1080 - 720) / 2);
    
    await padded.write('assets/android/playstore-icon-padded.png');
    console.log('Icon padded successfully');
  } catch (err) {
    console.error('Error padding icon:', err);
  }
}

run();
