import Particles from 'react-tsparticles';
import { loadSlim } from 'tsparticles-slim';

const EggsParticles: React.FC = () => {
  const particlesInit = async (engine: any) => {
    await loadSlim(engine);
  };

  return (
    <Particles
      id="eggsParticles"
      init={particlesInit}
      options={{
        fullScreen: { enable: false },
        particles: {
          number: {
            value: 20,
            density: {
              enable: true,
              area: 800,
            },
          },
          shape: {
            type: "image",
            image: {
              src: "/assets/basket.svg",
              width: 50,
              height: 50,
            },
          },
          size: {
            value: 30,
            random: { enable: true, minimumValue: 10 },
          },
          move: {
            enable: true,
            speed: 3,
            direction: "bottom",
            random: false,
            straight: false,
            outModes: {
              default: "out",
            },
          },
          opacity: {
            value: 0.8,
            random: { enable: true, minimumValue: 0.5 },
          },
        },
        detectRetina: true,
      }}
    />
  );
};

export default EggsParticles;
