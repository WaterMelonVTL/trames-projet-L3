import React from 'react'
import { Layer } from '../types/types'
function CalendarLayerSelection(props: { layers: Layer[], onClick: (id: number) => void, currentLayerId: number }) {
    return (
        <div className='flex flex-row flex-wrap justify-start items-center w-[80vw] '>
            {props.layers.map((layer: Layer) => (
                <div 
                    key={layer.Id} 
                    onClick={() => props.onClick(layer.Id)} 
                    className="flex max-w-[20rem] rounded-t-lg flex-row items-center justify-center w-40 h-10 border-2 border-black border-b-0 hover:cursor-pointer transition-all duration-300"
                    style={{
                        backgroundColor: props.currentLayerId === layer.Id ? layer.Color : 'white'
                    }}
                >
                    {layer.Name}
                </div>
            ))}
        </div>
    )
}

export default CalendarLayerSelection