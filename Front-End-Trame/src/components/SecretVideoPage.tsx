import React from 'react';

const SecretAudioGifPage: React.FC = () => {
  return (
    <div className="relative flex items-center justify-center h-screen bg-black">
      {/* Display the GIF with a maximum width */}
      <img 
        src="/assets/secret.gif" 
        alt="Secret" 
        className="max-w-md w-full h-auto object-contain" // max-w-md restricts width
      />
      {/* Audio element: hidden controls, autoplay and loop enabled */}
      <audio src="/assets/secretsound.mp3" autoPlay loop className="hidden" />
    </div>
  );
};

export default SecretAudioGifPage;
