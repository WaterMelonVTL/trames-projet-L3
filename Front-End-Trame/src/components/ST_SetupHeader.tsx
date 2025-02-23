import React from 'react';

interface SetupHeaderProps {
  setupStage: number;
  totalLayers: number;
}

const ST_SetupHeader: React.FC<SetupHeaderProps> = ({ setupStage, totalLayers }) => {
  const currentStep =
    setupStage === 1 ? 1 :
      setupStage === 2 ? 2 :
        setupStage === 3 ? 3 :
          setupStage < (4 + totalLayers) ? 4 : 5;
  console.log('Current Step:', currentStep);
  console.log('Setup Stage:', setupStage);
  console.log('Total Layers:', totalLayers);
  return (
    <div className="flex items-center justify-around mb-8">
      <div className={`rounded-full w-16 h-16 flex items-center justify-center text-3xl font-bold ${currentStep === 1 ? 'bg-blue-500 text-white' : currentStep > 1 ? 'bg-white border-4 border-blue-400 text-blue-400' : 'bg-gray-500 text-white'}`}>
        1
      </div>
      <h1 className={`font-bold text-2xl ml-2 mr-8 ${currentStep === 1 ? 'text-black' : currentStep > 1 ? 'text-blue-400' : 'text-gray-400'}`}>
        Nom
      </h1>

      <div className={`rounded-full w-16 h-16 flex items-center justify-center text-3xl font-bold ${currentStep === 2 ? 'bg-blue-500 text-white' : currentStep > 2 ? 'bg-white border-4 border-blue-400 text-blue-400' : 'bg-gray-500 text-white'}`}>
        2
      </div>
      <h1 className={`font-bold text-2xl ml-2 mr-8 ${currentStep === 2 ? 'text-black' : currentStep > 2 ? 'text-blue-400' : 'text-gray-400'}`}>
        Dates
      </h1>

      <div className={`rounded-full w-16 h-16 flex items-center justify-center text-3xl font-bold ${currentStep === 3 ? 'bg-blue-500 text-white' : currentStep > 3 ? 'bg-white border-4 border-blue-400 text-blue-400' : 'bg-gray-500 text-white'}`}>
        3
      </div>
      <h1 className={`font-bold text-2xl ml-2 mr-8 ${currentStep === 3 ? 'text-black' : currentStep > 3 ? 'text-blue-400' : 'text-gray-400'}`}>
        Layers
      </h1>
      
      <div className={`rounded-full w-16 h-16 flex items-center justify-center text-3xl font-bold ${currentStep === 4 ? 'bg-blue-500 text-white' : currentStep > 4 ? 'bg-white border-4 border-blue-400 text-blue-400' : 'bg-gray-500 text-white'}`}>
        4
      </div>
      <h1 className={`font-bold text-2xl ml-2 mr-8 ${currentStep === 4 ? 'text-black' : 'text-gray-400'}`}>
        Groupes
      </h1>
      
      <div className={`rounded-full w-16 h-16 flex items-center justify-center text-3xl font-bold ${currentStep === 5 ? 'bg-blue-500 text-white' : 'bg-gray-500 text-white'}`}>
        5
      </div>
      <h1 className={`font-bold text-2xl ml-2 mr-8 ${currentStep === 5 ? 'text-black' : 'text-gray-400'}`}>
        UEs
      </h1>
    </div>
  );
};

export default ST_SetupHeader;
