export const MONUMENTS = [
  { id:'eiffel', name:'Tour Eiffel', city:'Paris', country:'France', emoji:'🗼', hue:42, sprite:0, rarity:'Iconique', fact:'Construite pour l’Exposition universelle de 1889.' },
  { id:'arc', name:'Arc de Triomphe', city:'Paris', country:'France', emoji:'🏛️', hue:31, sprite:1, rarity:'Rare', fact:'Il domine la place Charles-de-Gaulle et ses douze avenues.' },
  { id:'sacre', name:'Sacré-Cœur', city:'Paris', country:'France', emoji:'⛪', hue:192, sprite:2, rarity:'Voyage', fact:'Sa silhouette blanche veille sur Montmartre.' },
  { id:'louvre', name:'Louvre', city:'Paris', country:'France', emoji:'🔺', hue:202, sprite:3, rarity:'Rare', fact:'Ancien palais royal, il abrite aujourd’hui un musée mondial.' },
  { id:'notredame', name:'Notre-Dame', city:'Paris', country:'France', emoji:'⛪', hue:278, rarity:'Iconique', fact:'La cathédrale gothique se dresse sur l’île de la Cité.' },
  { id:'colisee', name:'Colisée', city:'Rome', country:'Italie', emoji:'🏟️', hue:25, sprite:4, rarity:'Iconique', fact:'Cet amphithéâtre antique pouvait accueillir des dizaines de milliers de spectateurs.' },
  { id:'pantheon', name:'Panthéon de Rome', city:'Rome', country:'Italie', emoji:'🏛️', hue:46, sprite:5, rarity:'Voyage', fact:'Sa coupole antique reste l’une des plus impressionnantes au monde.' },
  { id:'trevi', name:'Fontaine de Trevi', city:'Rome', country:'Italie', emoji:'⛲', hue:191, sprite:6, rarity:'Rare', fact:'La tradition veut que l’on y jette une pièce pour revenir à Rome.' },
  { id:'stpierre', name:'Basilique Saint-Pierre', city:'Rome', country:'Vatican', emoji:'⛪', hue:211, sprite:7, rarity:'Iconique', fact:'Sa grande coupole marque l’horizon du Vatican.' },
  { id:'forum', name:'Forum romain', city:'Rome', country:'Italie', emoji:'🏛️', hue:14, rarity:'Voyage', fact:'Il fut le cœur politique et religieux de la Rome antique.' },
  { id:'bigben', name:'Big Ben', city:'Londres', country:'Royaume-Uni', emoji:'🕰️', hue:43, sprite:8, rarity:'Iconique', fact:'Big Ben est le surnom de la grande cloche de la tour Elizabeth.' },
  { id:'towerbridge', name:'Tower Bridge', city:'Londres', country:'Royaume-Uni', emoji:'🌉', hue:203, sprite:9, rarity:'Rare', fact:'Son tablier mobile permet aux grands navires de remonter la Tamise.' },
  { id:'londoneye', name:'London Eye', city:'Londres', country:'Royaume-Uni', emoji:'🎡', hue:353, sprite:10, rarity:'Voyage', fact:'La grande roue offre une vue panoramique sur Londres.' },
  { id:'buckingham', name:'Buckingham Palace', city:'Londres', country:'Royaume-Uni', emoji:'🏰', hue:272, rarity:'Rare', fact:'Le palais est la résidence londonienne officielle du souverain britannique.' },
  { id:'stpauls', name:'Cathédrale Saint-Paul', city:'Londres', country:'Royaume-Uni', emoji:'⛪', hue:161, rarity:'Voyage', fact:'Sa coupole domine la City depuis plus de trois siècles.' },
  { id:'liberty', name:'Statue de la Liberté', city:'New York', country:'États-Unis', emoji:'🗽', hue:161, sprite:11, rarity:'Iconique', fact:'La statue fut offerte par la France aux États-Unis.' },
  { id:'empire', name:'Empire State Building', city:'New York', country:'États-Unis', emoji:'🏙️', hue:210, sprite:12, rarity:'Rare', fact:'Ce gratte-ciel Art déco a longtemps été le plus haut du monde.' },
  { id:'brooklyn', name:'Brooklyn Bridge', city:'New York', country:'États-Unis', emoji:'🌉', hue:19, sprite:13, rarity:'Voyage', fact:'Il relie Manhattan à Brooklyn au-dessus de l’East River.' },
  { id:'flatiron', name:'Flatiron Building', city:'New York', country:'États-Unis', emoji:'🏢', hue:38, rarity:'Rare', fact:'Sa forme triangulaire lui a donné son célèbre surnom.' },
  { id:'chrysler', name:'Chrysler Building', city:'New York', country:'États-Unis', emoji:'🏙️', hue:290, rarity:'Iconique', fact:'Sa flèche métallique est un symbole de l’Art déco new-yorkais.' },
  { id:'pyramids', name:'Pyramides de Gizeh', city:'Le Caire', country:'Égypte', emoji:'🔺', hue:41, sprite:14, rarity:'Iconique', fact:'La grande pyramide est la seule merveille antique encore debout.' },
  { id:'sphinx', name:'Sphinx de Gizeh', city:'Le Caire', country:'Égypte', emoji:'🦁', hue:28, sprite:15, rarity:'Rare', fact:'Le gardien de pierre possède un corps de lion et une tête humaine.' },
  { id:'citadelle', name:'Citadelle de Saladin', city:'Le Caire', country:'Égypte', emoji:'🏰', hue:176, rarity:'Voyage', fact:'Cette forteresse médiévale domine la ville historique.' },
  { id:'mohamedali', name:'Mosquée Mohammed-Ali', city:'Le Caire', country:'Égypte', emoji:'🕌', hue:196, rarity:'Rare', fact:'Ses minarets élancés sont visibles depuis une grande partie du Caire.' },
  { id:'cairotower', name:'Tour du Caire', city:'Le Caire', country:'Égypte', emoji:'🗼', hue:336, rarity:'Voyage', fact:'Sa silhouette en treillis évoque une fleur de lotus.' },
  { id:'sensoji', name:'Temple Sensō-ji', city:'Tokyo', country:'Japon', emoji:'🏯', hue:355, rarity:'Iconique', fact:'C’est le plus ancien temple bouddhiste de Tokyo.' },
  { id:'torii', name:'Torii de Nezu', city:'Tokyo', country:'Japon', emoji:'⛩️', hue:9, rarity:'Rare', fact:'Les portiques vermillon dessinent un passage spectaculaire.' },
  { id:'tokyotower', name:'Tokyo Tower', city:'Tokyo', country:'Japon', emoji:'🗼', hue:20, rarity:'Voyage', fact:'Sa structure orange et blanche s’inspire des grandes tours métalliques.' },
  { id:'skytree', name:'Tokyo Skytree', city:'Tokyo', country:'Japon', emoji:'📡', hue:212, rarity:'Rare', fact:'Elle est l’une des plus hautes tours de radiodiffusion au monde.' },
  { id:'imperial', name:'Palais impérial', city:'Tokyo', country:'Japon', emoji:'🏯', hue:147, rarity:'Voyage', fact:'Ses jardins forment une oasis au cœur de la métropole.' },
  { id:'christ', name:'Christ Rédempteur', city:'Rio', country:'Brésil', emoji:'🗿', hue:186, rarity:'Iconique', fact:'La statue ouvre ses bras au sommet du Corcovado.' },
  { id:'sugarloaf', name:'Pain de Sucre', city:'Rio', country:'Brésil', emoji:'⛰️', hue:139, rarity:'Rare', fact:'Un téléphérique relie ses sommets au-dessus de la baie.' },
  { id:'selaron', name:'Escalier Selarón', city:'Rio', country:'Brésil', emoji:'🪜', hue:322, rarity:'Voyage', fact:'Ses marches sont couvertes de carreaux venus du monde entier.' },
  { id:'maracana', name:'Maracanã', city:'Rio', country:'Brésil', emoji:'🏟️', hue:46, rarity:'Rare', fact:'Ce stade est un lieu mythique du football brésilien.' },
  { id:'arcoslapa', name:'Arches de Lapa', city:'Rio', country:'Brésil', emoji:'🌉', hue:18, rarity:'Voyage', fact:'Cet ancien aqueduc est devenu un symbole du quartier de Lapa.' },
  { id:'sagrada', name:'Sagrada Família', city:'Barcelone', country:'Espagne', emoji:'⛪', hue:24, rarity:'Iconique', fact:'La basilique de Gaudí continue d’évoluer depuis le XIXe siècle.' },
  { id:'batllo', name:'Casa Batlló', city:'Barcelone', country:'Espagne', emoji:'🏠', hue:203, rarity:'Rare', fact:'Sa façade ondulée semble sortie d’un conte marin.' },
  { id:'guell', name:'Parc Güell', city:'Barcelone', country:'Espagne', emoji:'🦎', hue:142, rarity:'Voyage', fact:'Ses mosaïques colorées épousent les formes du paysage.' },
  { id:'arcbarca', name:'Arc de Triomf', city:'Barcelone', country:'Espagne', emoji:'🏛️', hue:7, rarity:'Rare', fact:'Son décor de briques rouges accueille les visiteurs du parc de la Ciutadella.' },
  { id:'columbus', name:'Colonne Christophe Colomb', city:'Barcelone', country:'Espagne', emoji:'🗿', hue:256, rarity:'Voyage', fact:'La colonne monumentale se dresse au bout de la Rambla.' },
  { id:'hagia', name:'Sainte-Sophie', city:'Istanbul', country:'Turquie', emoji:'🕌', hue:350, rarity:'Iconique', fact:'Son immense coupole raconte plusieurs siècles d’histoire.' },
  { id:'bluemosque', name:'Mosquée Bleue', city:'Istanbul', country:'Turquie', emoji:'🕌', hue:211, rarity:'Rare', fact:'Six minarets entourent son élégante silhouette.' },
  { id:'galata', name:'Tour de Galata', city:'Istanbul', country:'Turquie', emoji:'🗼', hue:36, rarity:'Voyage', fact:'La tour offre une vue circulaire sur le Bosphore.' },
  { id:'topkapi', name:'Palais de Topkapı', city:'Istanbul', country:'Turquie', emoji:'🏰', hue:158, rarity:'Rare', fact:'Le palais fut le centre du pouvoir ottoman pendant des siècles.' },
  { id:'bosporus', name:'Pont du Bosphore', city:'Istanbul', country:'Turquie', emoji:'🌉', hue:279, rarity:'Voyage', fact:'Il relie symboliquement l’Europe et l’Asie.' },
  { id:'opera', name:'Opéra de Sydney', city:'Sydney', country:'Australie', emoji:'🎭', hue:196, rarity:'Iconique', fact:'Ses voiles blanches bordent directement le port.' },
  { id:'harbour', name:'Harbour Bridge', city:'Sydney', country:'Australie', emoji:'🌉', hue:214, rarity:'Rare', fact:'Les habitants le surnomment affectueusement le cintre.' },
  { id:'sydneytower', name:'Sydney Tower Eye', city:'Sydney', country:'Australie', emoji:'🗼', hue:43, rarity:'Voyage', fact:'Sa plateforme domine le centre-ville et la baie.' },
  { id:'queenbuilding', name:'Queen Victoria Building', city:'Sydney', country:'Australie', emoji:'🏛️', hue:340, rarity:'Rare', fact:'Ce bâtiment roman est célèbre pour ses verrières et ses horloges.' },
  { id:'bondipavilion', name:'Bondi Pavilion', city:'Sydney', country:'Australie', emoji:'🏖️', hue:168, rarity:'Voyage', fact:'Ce pavillon Art déco fait face à l’une des plages les plus connues du pays.' }
];

export const DESTINATIONS = [
  { id:'paris', name:'Paris', country:'France', flag:'🇫🇷', levels:[1,30], color:'#f2bd45', monumentIds:['eiffel','arc','sacre','louvre','notredame'] },
  { id:'rome', name:'Rome', country:'Italie', flag:'🇮🇹', levels:[31,60], color:'#ee7653', monumentIds:['colisee','pantheon','trevi','stpierre','forum'] },
  { id:'london', name:'Londres', country:'Royaume-Uni', flag:'🇬🇧', levels:[61,90], color:'#63b8e5', monumentIds:['bigben','towerbridge','londoneye','buckingham','stpauls'] },
  { id:'newyork', name:'New York', country:'États-Unis', flag:'🇺🇸', levels:[91,120], color:'#9c81ef', monumentIds:['liberty','empire','brooklyn','flatiron','chrysler'] },
  { id:'cairo', name:'Le Caire', country:'Égypte', flag:'🇪🇬', levels:[121,150], color:'#e6a84e', monumentIds:['pyramids','sphinx','citadelle','mohamedali','cairotower'] },
  { id:'tokyo', name:'Tokyo', country:'Japon', flag:'🇯🇵', levels:[151,180], color:'#ed6680', monumentIds:['sensoji','torii','tokyotower','skytree','imperial'] },
  { id:'rio', name:'Rio', country:'Brésil', flag:'🇧🇷', levels:[181,210], color:'#59ca88', monumentIds:['christ','sugarloaf','selaron','maracana','arcoslapa'] },
  { id:'barcelona', name:'Barcelone', country:'Espagne', flag:'🇪🇸', levels:[211,240], color:'#f08e45', monumentIds:['sagrada','batllo','guell','arcbarca','columbus'] },
  { id:'istanbul', name:'Istanbul', country:'Turquie', flag:'🇹🇷', levels:[241,270], color:'#71b4cc', monumentIds:['hagia','bluemosque','galata','topkapi','bosporus'] },
  { id:'sydney', name:'Sydney', country:'Australie', flag:'🇦🇺', levels:[271,300], color:'#62c9c0', monumentIds:['opera','harbour','sydneytower','queenbuilding','bondipavilion'] }
];

export const BOOSTERS = {
  hammer:{ id:'hammer', name:'Marteau', icon:'🔨', description:'Retire une pièce ou une couche d’obstacle.' },
  swap:{ id:'swap', name:'Échange', icon:'🔄', description:'Permute deux pièces adjacentes sans condition.' },
  rocket:{ id:'rocket', name:'Fusée', icon:'🚀', description:'Nettoie une ligne et une colonne.' },
  globe:{ id:'globe', name:'Globe', icon:'🌍', description:'Supprime tous les monuments d’une catégorie.' }
};

export function getDestinationForLevel(level){
  return DESTINATIONS.find(d=>level>=d.levels[0] && level<=d.levels[1]) || DESTINATIONS[DESTINATIONS.length-1];
}

export function getLevelConfig(level){
  const destination=getDestinationForLevel(level);
  const local=((level-1)%30)+1;
  const ids=destination.monumentIds;
  const difficulty=local%15===0?'EXTREME':local%7===0?'HARD':'NORMAL';
  const baseMoves=local<=10?27:local<=20?25:23;
  const goals=[];
  if(local<=3){ goals.push({type:'collect',id:ids[(local-1)%ids.length],target:8+local*2}); }
  else if(local%6===0){ goals.push({type:'score',target:4200+level*55}); }
  else if(local%5===0){ goals.push({type:'ice',target:8+Math.min(8,Math.floor(local/2))}); goals.push({type:'collect',id:ids[local%ids.length],target:10}); }
  else if(local%4===0){ goals.push({type:'postcard',target:6+Math.floor(local/4)}); goals.push({type:'collect',id:ids[(local+1)%ids.length],target:8}); }
  else { goals.push({type:'collect',id:ids[local%ids.length],target:11+Math.floor(local/3)}); goals.push({type:'collect',id:ids[(local+2)%ids.length],target:8+Math.floor(local/4)}); }
  return {
    level,destination,local,difficulty,
    moves:baseMoves+(difficulty==='HARD'?2:difficulty==='EXTREME'?4:0),
    goals,
    obstacleCount: local<4?0:Math.min(18,4+Math.floor(local/2)),
    rewards:{coins:34+local*2+(difficulty==='NORMAL'?0:difficulty==='HARD'?22:48),cards:local%3===0?1:0}
  };
}

export function monumentById(id){ return MONUMENTS.find(m=>m.id===id); }

export const DAILY_REWARDS = [
  {icon:'🪙',label:'80 pièces',coins:80},
  {icon:'🔨',label:'1 marteau',booster:'hammer'},
  {icon:'🪙',label:'120 pièces',coins:120},
  {icon:'🚀',label:'1 fusée',booster:'rocket'},
  {icon:'🎁',label:'Coffre voyage',coins:160,booster:'swap'},
  {icon:'🪙',label:'220 pièces',coins:220},
  {icon:'🌍',label:'Grand coffre',coins:350,booster:'globe'}
];
