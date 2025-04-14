

# Explications Stack 
## Front end : 
### React TS
On connait react, cette fois on s'attaque à react TS (TypeScript) c'est pareil, mais en plus contraignant par ce qu'il est fortement typé. 
Mais au moins, ça fait du code vraiment propre car typé (ce que javascript ne fait pas) la syntaxe est la meme que JS, sauf que les variables sont typées. 

Comme d'habitude, on sépare le code un maximum en composants. Si un code est dupliqué, alors c'est que tu peux en créer un composant. 
___
### Vite
C'est rapide, c'est efficace. On aime.
___
### Tailwind
Ici on veut pas juste un site qui fonctionne, mais un site BEAU GOSSE qui fonctionne. Tailwind c'est bien, ça permet de faire du css dans le code directement. En plus ça va pemermetre de garder de la cohérence au travers du site à l'aide de variables. 
Exemple : 
```bg-primary, bg-secondary, bg-accent, bg-text, bg-background```on verra ce qu'on implemente. 

la doc est ici : (https://tailwindcss.com/docs/installation)
Sinon copilot s'en sort si jamais.
___
### Comunication avec le serveur : 
Pour communiquer cette fois on va passer par des requetes normales, aka, pas de socket.
Donc en réact ça marche comme ça : 
```typescript
const [annonces, setAnnonces] = useState<House[]>([]);
useEffect(() => {
        document.title = "LendIt | Home";

        const fetchData = async () => {
            console.log('Fetching house data...');
            try {
                const response = await fetch(`${import.meta.env.VITE_SERVER_ROOT}/api/houses/best/6`);

                // Check if the response is successful
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                // Log the raw response text
                const text = await response.text();
                console.log('Raw response:', text);

                // Attempt to parse the response as JSON
                const data = JSON.parse(text);

                if (Array.isArray(data) && data.length > 0) {
                    setAnnonces(data);
                }
                console.log(data);
            } catch (error) {
                console.error('Error fetching house data:', error);
            }
        };

        fetchData();

    }, []);
```
Le `useState<House[]>([]);` ça fait partie de TypeScript, vu qu'il veut un type faut creer un type house : 
```typescript
type House = {
    Id: number;
    Street: string;
    Number: string;
    ZipCode: string;
    Country: string;
    Description: string;
    Price: number;
    Owner: number;
}
```
Mais bref, c'est pas le sujet. 

en parlant de serveur :
## Back End:
C'est là que ça devient rigolo. 
Vous vous rapellez l'an dernier notre serveur qui faisait 1700 lignes ? 
Bah cette année on n'en veut pas. On veut un truc propre. 
Donc on va utiliser la fonctionalité "Routes" de express. 

En gros c'est simple,
on met tout le code qui concerne un sujet, par exemple : les utilisateurs, les cours etc... dans des fichiers séparés dans le dossier /serveur/src/routes/

et on l'importe ensuite dans le serveur principal comme ça : 
par exemple, si on a la route /serveur/src/routes/users.js : 
```javascript
const userRoutes = require('./routes/users');
app.use('/api/users', userRoutes);
```

Et ce qui est super, c'est que du coup, si on veut faire une requete au serveur à la route 
ip:port/api/users/quelque_chose

il suffit dans le fichier users.js de definir la sous route : 
```js
router.get('/quelque_chose', async (req, res) => {
  faisqqchose()
  return res.json(qqchose)
});
```

Et ce qui est bien c'est que si on appelle api/cours/quelque_chose et bah ça fera rien, c'est indépendant. 

Vous avez tout plein d'exemples dans le serveur sur le git. 

___
### Base de donnée 
Petite découverte de ma part, tres tres pratique : **sequelize**

Il suffit de définir la BBD dans le fichier : src/models/index.js comme si on definissait des types .
Exemple :
```js
// Define User model
const User = sequelize.define('User', {
    Id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    FirstName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    LastName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    Email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    Password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    Points: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    Picture : {
        type: DataTypes.STRING,
        allowNull: true
    },
    Role: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'USER'
    },
});
```
Puis de définir les contraintes : 
```js
User.hasMany(House, { foreignKey: 'Owner' });
House.belongsTo(User, { foreignKey: 'Owner' });
```

et ensuite on est nickel
on peut maintenant dans une route, par exemple ici user, importer la table correspondante : 
```js
const { User, Sequelize, sequelize } = require('../models');
```
et on peut faire toutes les operations qu'on veut dessus super facilement : 
exemple : 
```js
await User.create({
                Email: email,
                Password: hashedPassword,
                FirstName: 'Initial',
                LastName: 'Admin',
                Role: 'ADMIN'
            });

//ou
User.findAll()
//ou
User.findByPk(userId)
//ou
User.count({ where: { Role: 'ADMIN' } })
//ect...
```
Copilot connait donc hesitez pas à lui demander


## Conclusions générales
Toutes ces choses vont faire que notre code sera propre, maintenable et bien structuré. 
Je vous laisse checker l'exemple que j'ai laissé dans le dépot github. 
Globalement, on va essayer de toujours respecter les principes de programation propre, tels que : 
- Eviter la répetition de code, transformer en fonction
- une fonction = une utilité, si une fonciton a plusieurs étapes, les sortir en sous fonctions)
- variables et nom de fonctions qui ont un sens. Aucune abreviation sauf celles générales comme "ID" par exemple. 
- Bien sur code propre. 
- Pas besoin de commentaires de code, si c'est bien fait, on doit pouvoir le lire directement. Exemple : 
```js
const CreateInitialAdmin = async () =>{
    const AdminCount = User.count({where : { Role: "ADMIN"}});
    if (adminCount === O){
          try{
              await User.create(AdminUser)
              console.log('Initial admin user created');
           } catch (err) {
              console.error('Error Creating initial admin user')
              console.error(err)
            }
    }
}
```
Là rien qu'en lisant on comprend directement ce qu'il se passe, par ce que les variables sont bien nommées. 
C'est évidemment un exemple simplifié, mais globalement c'est l'idée. 
- De "nester" les fonctions. 
si on a un if, dans un if, dans un if, dans un try, on s'y retrouve pas. 
Il y a pas mal de methodes pour éviter ça, la plus simple et d'inverser les if. 
Au lieu de faire :

```js
if (user!=null){
  if (user.isVerified){
      if (user.hasHouses){
          //do something
      } else {
          console.log("user does not have a house")
          return;
      }
  } else {
      console.log("user is not verified")
      return;
  }
}else {
  console.log("user is null")
  return;
}
```
mieux vaut ecrire : 
```js
if (user==null){
  console.log("user is null")
  return;
}
if (!user.isVerified){
  console.log("user is not verified")
  return;
}
if (!user.hasHouses){
   console.log("user does not have a house")
   return;
}

// do something...
```

C'est beaucoup plus clair. 

Cependant, c'est inévitable avec les try - catch (que vous devez imperativement utiliser)
sauf avec cette methode :
## Pour eviter l'enfer du try - catch

le probleme du try catch, est que, bien que indispensable, il force le code à etre super nesté. 
Sauf en utilisant cette petite technique (que je n'avais pas utilisé à l'époque de la V1 du serveur, celle que je vous ai envoyé, donc je vous la montre ici
```js
export function catchError(promise) {
    return promise.then(data => [null, data]).catch(error => [error, null]);
}
```
Dans un fichier utils.js
Et de l'importer dans les differentes routes au besoin. 

Et ensuite,
Au lieu de try/catch chaque partie du code qui peut causer des erreurs, comme ici : 
```js
// Delete a user
router.delete('/:id', async (req, res) => {
    const userId = req.params.id;
    try {
        const user = await User.findByPk(userId);
        if (!user) {
            res.status(404).send('User not found');
            return;
        }
        await user.destroy();
        res.send('User deleted successfully');
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Internal Server Error');
    }
});
```

On peut simplement faire : 
```js
// Delete a user
router.delete('/:id', async (req, res) => {
    const userId = req.params.id;
    const [error, user] = await catchError(User.findByPk(userId));
    if (error){
        console.error(err.message);
        res.status(500).send('Internal Server Error');
    }
    if (!user) {
        res.status(404).send('User not found');
        return;
    }
    await user.destroy();
    res.send('User deleted successfully');
    
});
```

C'est beaucoup plus clair. là encore ça va car il y a qu'un seul try catch, mais quand il y en a beacoup on se retrouve tres vite avec des try, dans des try, dans des try...


