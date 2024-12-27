import React, { useEffect, useState } from 'react'
import { Context } from '../types/types.tsx'

const ARROW = <svg fill="#000000" height="200px" width="200px" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" viewBox="0 0 330 330" xmlSpace="preserve">
  <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
  <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
  <g id="SVGRepo_iconCarrier">
    <g id="XMLID_2_" strokeWidth={1}>
      <path id="XMLID_4_" d="M145.606,74.393c-5.857-5.857-15.355-5.858-21.213,0.001c-5.858,5.858-5.858,15.355,0,21.213l69.393,69.392 l-69.393,69.395c-5.858,5.858-5.858,15.355,0,21.213C127.322,258.536,131.161,260,135,260s7.678-1.464,10.606-4.394l80-80.002 c2.814-2.813,4.394-6.628,4.394-10.607c0-3.979-1.58-7.794-4.394-10.607L145.606,74.393z"></path>
      <path id="XMLID_5_" d="M165,0C74.019,0,0,74.019,0,165s74.019,165,165,165s165-74.019,165-165S255.981,0,165,0z M165,300 c-74.439,0-135-60.561-135-135S90.561,30,165,30s135,60.561,135,135S239.439,300,165,300z"></path>
    </g>
  </g>
</svg>




function Home() {
  const userID = 1 // Later get it from authentification
  const username = "Beaugosse" // Later get it from authentification
  
  const [contexts, setContexts] = useState([] as Context[])

  const CreateContext = () => {
    fetch('http://localhost:3000/api/context', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        Name: "Nouveau contexte",
        Owner: userID
      })
    })
      .then((res) => res.json())
      .then((data) => {
        setContexts([...contexts, data])
      })
  }

  useEffect(() => {
    fetch(`http://localhost:3000/api/context/user/${userID}`)
      .then((res) => res.json())
      .then((data) => {
        setContexts(data)
      }
      )
  }, [])

  return (


    <div className='flex flex-col items-center justify-center h-screen'>
      <h1 className='font-bold text-3xl '>Bienvenue {username}</h1>
      <h2>Selectionnez un contexte :</h2>

      <div className="grid grid-cols-4 gap-2 w-[70vw]">
        <div className='w-full h-40 border-2 border-black rounded-lg flex items-center justify-around hover:cursor-pointer hover:bg-blue-500 hover:text-white transition-all duration-300' onClick={CreateContext}> 
          <h1 className='w-1/2 text-2xl font-bold'>Créer un nouveau contexte</h1>
          <div className='w-1/4 h-1/2 flex justify-center items-center'>{ARROW}</div>
        </div>
        {contexts.length > 0 ? (

          contexts.map((context, index) => (
            <div className='w-full h-40 border-2 border-black rounded-lg' key={index}>{context.Name}</div>
          ))

        ) : (
          <div className='w-full h-40 flex flex-col items-center justify-center '>
            <h1 className='text-2xl font-bold'>Vous n'avez pas encore de contextes...</h1>
            <h1 className='text-xl font-normal'>Vous pouvez en créer un en utilisante le bouton à gauche</h1>

          </div>
        )}
      </div>


    </div>

  )
}

export default Home