import React, { useEffect, useState } from 'react'
import { Context, Tramme } from '../types/types.tsx'
import { useNavigate } from 'react-router-dom';

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
  const [contextID, setContextID] = useState(-1)
  const [currentContext, setCurrentContext] = useState({} as Context)
  const [trammes, setTrammes] = useState([] as Tramme[])
  const navigate = useNavigate();

  const CreateContext = () => {
    fetch('http://localhost:3000/api/contexts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ ContextName: "Nouveau Contexte", User: { Id: userID } })
    })
      .then((res) => res.json())
      .then((data) => {
        setContexts([...contexts, data]);//potentiellement useless à cause de la navigation qui suit
        navigate(`/edit/context/${data.Id}`);
      });
  }

  const CreateTramme = () => {
    fetch('http://localhost:3000/api/trammes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ data:{Name: "Nouvelle Tramme", ContextId: contextID, Year:2004}, user: { Id: userID } })
    })
      .then((res) => res.json())
      .then((data) => {
        setTrammes([...trammes, data]);//potentiellement useless à cause de la navigation qui suit
        navigate(`/edit/tramme/${data.Id}`);
      });
  }

  useEffect(() => {
    fetch(`http://localhost:3000/api/contexts/user/${userID}`)
      .then((res) => res.json())
      .then((data) => {
        setContexts(data)
      }
      )
  }, [])

  useEffect(() => {
    const fetchContext = async () => {
      const res = await fetch(`http://localhost:3000/api/contexts/${contextID}`);
      if (!res.ok) {
        throw new Error('Error fetching context');
      }
      return res.json();
    };
  
    const fetchTrammes = async () => {
      const res = await fetch(`http://localhost:3000/api/trammes/context/${contextID}`);
      if (!res.ok) {
        throw new Error('Error fetching trammes');
      }
      return res.json();
    };
  
    const fetchData = async () => {
      try {
        const contextData = await fetchContext();
        setCurrentContext(contextData);
        const trammesData = await fetchTrammes();
        setTrammes(trammesData);
      } catch (error) {
        if (error instanceof Error) { //typescript était pas content
          alert(error.message);
        } else {
          alert('An unknown error occurred');
        }
      }
    };
    
    if (contextID !== -1) fetchData();
  }, [contextID]);

  return (


    <div className='flex flex-col items-center justify-center h-screen'>
      <h1 className='font-bold text-3xl '>Bienvenue {username}</h1>

      {contextID === -1 && // Externaliser en composant
        <>
          <h2>Selectionnez un contexte :</h2>
          <div className="grid grid-cols-4 gap-2 w-[70vw]">
            <div className='w-full h-40 border-2 border-black rounded-lg flex items-center justify-between hover:cursor-pointer hover:bg-blue-500 hover:text-white transition-all duration-300' onClick={CreateContext}>
              <h1 className='w-1/2 text-2xl font-bold'>Créer un nouveau contexte</h1>
              <div className='w-1/4 h-1/2 flex justify-center items-center mr-8'>{ARROW}</div>
            </div>
            {contexts.length > 0 ? (

              contexts.map((context, index) => (
                <div className='w-full h-40 border-2 flex flex-row justify-between p-8 border-black rounded-lg hover:cursor-pointer hover:bg-blue-500 hover:text-white transition-all duration-300' onClick={() => { setContextID(context.Id) }} key={index}>

                  <div className='flex flex-col justify-around'>
                    <h1>{context.Name}</h1>
                    <button className='bg-blue-500 text-white rounded-lg px-2' onClick={() => navigate(`/edit/context/${context.Id}`)}>Editer</button>

                  </div>
                  <div className='w-1/4 h-1/2 flex justify-center items-center'>{ARROW}</div>
                </div>
              ))

            ) : (
              <div className='w-full h-40 flex flex-col items-center justify-center '>
                <h1 className='text-2xl font-bold'>Vous n'avez pas encore de contextes...</h1>
                <h1 className='text-xl font-normal'>Vous pouvez en créer un en utilisant le bouton à gauche</h1>

              </div>
            )}

          </div>
        </>
      }
      {contextID !== -1 && // Externaliser en composant (utiliser le meme mais parametré papr exemple : type="context/tramme")
        <>
          <h2>Selectionnez une Tramme :</h2>
          <div className="grid grid-cols-4 gap-2 w-[70vw]">
            <div className='w-full h-40 border-2 border-black rounded-lg flex items-center justify-between hover:cursor-pointer hover:bg-blue-500 hover:text-white transition-all duration-300' onClick={CreateTramme}>
              <h1 className='w-1/2 text-2xl font-bold'>Créer une nouvelle tramme</h1>
              <div className='w-1/4 h-1/2 flex justify-center items-center mr-8'>{ARROW}</div>
            </div>
            {trammes.length > 0 ? (

              trammes.map((tramme, index) => (
                <div className='w-full h-40 border-2 flex flex-row justify-between p-8 border-black rounded-lg' key={index}>

                  <div className='flex flex-col justify-around'>
                    <h1>{tramme.Name}</h1>
                    <button className='bg-blue-500 text-white rounded-lg px-2' onClick={() => navigate(`/edit/tramme/${tramme.Id}`)}>Editer</button>

                  </div>
                  <div className='w-1/4 h-1/2 flex justify-center items-center'>{ARROW}</div>
                </div>
              ))

            ) : (
              <div className='w-full h-40 flex flex-col items-center justify-center '>
                <h1 className='text-2xl font-bold'>Il n'y a pas encore de tramme dans '{currentContext.Name}'</h1>
                <h1 className='text-xl font-normal'>Vous pouvez en créer une en utilisant le bouton à gauche</h1>

              </div>
            )}

          </div>
        </>
      }


    </div>

  )
}

export default Home