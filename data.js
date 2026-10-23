/* Transcribed from Vocabulaire - La Bonne Bouffe, 21 slides.
   The two repeated terms (pepper and ice cream) belong to both categories. */
(function (root) {
  const categories = [
    ['fruit', 'Fruit', 'Les fruits', 3], ['vegetables', 'Vegetables', 'Les légumes', 5],
    ['dairy', 'Dairy', 'Les produits laitiers', 7], ['protein', 'Protein', 'Les protéines', 9],
    ['grains', 'Grains', 'Les céréales', 11], ['desserts', 'Desserts', 'Les desserts', 13],
    ['drinks', 'Drinks', 'Les boissons', 15], ['snacks', 'Fast food & snacks', 'La malbouffe', 17],
    ['pantry', 'Pantry & spices', 'Le garde-manger et les épices', 19],
    ['describing', 'Describing food', 'Les adjectifs', 21], ['table', 'At the table', 'Les mots clés', 21]
  ].map(([id,en,fr,page])=>({id,en,fr,page}));
  const words=[];
  function add(cat, rows) {
    rows.forEach(([en,fr,enAlt=[],frAlt=[],note=''])=>{
      words.push({id:cat+'-'+en.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/-$/,''),en,fr,enAlt,frAlt,categories:[cat],page:categories.find(c=>c.id===cat).page,note});
    });
  }
  add('fruit', [
    ['Apple','la pomme',['apples'],['les pommes']],
    ['Grapefruit','le pamplemousse',['grapefruits'],['les pamplemousses']],
    ['Raspberry','la framboise',['raspberries'],['les framboises']],
    ['Pear','la poire',['pears'],['les poires']],
    ['Strawberry','la fraise',['strawberries'],['les fraises']],
    ['Watermelon','la pastèque',['watermelons'],['les pastèques']],
    ['Mango','la mangue',['mangoes','mangos'],['les mangues']],
    ['Cherry','la cerise',['cherries'],['les cerises']],
    ['Peach','la pêche',['peaches'],['les pêches']],
    ['Pineapple','l’ananas',['pineapples']],
    ['Banana','la banane',['bananas'],['les bananes']],
    ['Orange','l’orange',['oranges'],['les oranges']],
    ['Blueberry','la myrtille',['blueberries'],['les myrtilles']],
    ['Grape','le raisin',['grapes'],['les raisins']],
    ['Apricot','l’abricot',['apricots'],['les abricots']],
    ['Lemon','le citron',['lemons'],['les citrons']]
  ]);
  add('vegetables', [
    ['Carrot','la carotte',['carrots'],['les carottes']],
    ['Cucumber','le concombre',['cucumbers'],['les concombres']],
    ['Celery','le céleri'],
    ['Pepper','le poivre',['black pepper'],[],'The slides put le poivre in Vegetables and Pantry. It means pepper, the seasoning. A bell pepper is le poivron.'],
    ['Peas','le petit pois',['pea'],['les petits pois','les pois']],
    ['Eggplant','l’aubergine',['aubergine','eggplants','aubergines'],['les aubergines']],
    ['Lettuce','la salade',[],['la laitue'],'The slide uses la salade for lettuce; la laitue is also accepted. La salade can also mean salad.'],
    ['Potato','la pomme de terre',['potatoes'],['les pommes de terre']],
    ['Mushroom','le champignon',['mushrooms'],['les champignons']],
    ['Broccoli','le brocoli'], ['Corn','le maïs',['maize']], ['Squash','la courge',['squashes'],['les courges']],
    ['Zucchini','les courgettes',['courgette','courgettes','zucchinis'],['la courgette']],
    ['Cauliflower','le chou-fleur',['cauliflowers'],['les choux-fleurs']],
    ['Cabbage','le chou',['cabbages'],['les choux']], ['Asparagus','l’asperge',[],['les asperges']]
  ]);
  add('dairy', [
    ['Cheese','le fromage'], ['Milk','le lait'], ['Yogurt','le yaourt',['yoghurt'],['le yogourt','le yoghourt']],
    ['Ice cream','la crème glacée',[],['la glace']], ['Cream','la crème'], ['Butter','le beurre'],
    ['Whipped cream','la crème fouettée',[],['la chantilly']], ['Cream cheese','le fromage à la crème'],
    ['Sour cream','la crème sure',[],['la crème aigre']],
    ['Cheese curds','le fromage en grains',['cheese curd'],['le fromage en grain'],'The slide lists Cheese curd without a French answer. Le fromage en grains has been supplied to complete the pair.']
  ]);
  add('protein', [
    ['Fish','le poisson',['fishes'],['les poissons']], ['Seafood','les fruits de mer'],
    ['Beef','le bœuf',[],['le boeuf']], ['Goat meat','la viande de chèvre',['goat']],
    ['Chicken','le poulet'], ['Lamb','l’agneau'], ['Pork','le porc',[],[],'The English label Porc in the slide is corrected to Pork.'],
    ['Bacon','le bacon / le lardon',[],['le bacon','le lardon','les lardons'],'Both slide answers are accepted. Lardons are small pieces of bacon.'],
    ['Eggs','les œufs',['egg'],['les oeufs','l’œuf','l’oeuf']], ['Nuts','les noix',['nut']], ['Tofu','le tofu'], ['Beans','les haricots',['bean'],['le haricot']]
  ]);
  add('grains', [
    ['Bread','le pain'], ['Pasta','les pâtes'], ['Rice','le riz'], ['Quinoa','le quinoa'],
    ['Wraps','les wraps',['wrap'],['le wrap']], ['Oatmeal','les flocons d’avoine',['oats','rolled oats'],['le gruau']],
    ['Couscous','le couscous'], ['Crackers','les craquelins',['cracker'],['le craquelin']]
  ]);
  add('desserts', [
    ['Cake','un gâteau',['cakes'],['le gâteau','les gâteaux']],
    ['Cupcake','un petit gâteau',['cupcakes'],['le petit gâteau','les petits gâteaux','un cupcake','le cupcake']],
    ['Pastries','les pâtisseries / les viennoiseries',['pastry'],['les pâtisseries','les viennoiseries','la pâtisserie','la viennoiserie']],
    ['Pie','la tourte',['pies'],['les tourtes'], 'The slide uses la tourte for pie and la tarte for tart. These terms can overlap in everyday use; this deck keeps the classroom distinction.'],
    ['Tart','la tarte',['tarts'],['les tartes']], ['Cookies','les biscuits',['cookie','biscuits','biscuit'],['le biscuit']],
    ['Chocolate','le chocolat'], ['Pudding','les entremets',[],['l’entremets','le pudding'],'The slide uses les entremets, a broader word for desserts, for pudding.']
  ]);
  words.find(w=>w.en==='Ice cream').categories.push('desserts');
  add('drinks', [
    ['Water','l’eau'], ['Juice','le jus'], ['Pop','une boisson gazeuse',['soda','soft drink','fizzy drink'],['la boisson gazeuse','le soda']],
    ['Tea','le thé'], ['Iced tea','le thé glacé',['ice tea']], ['Coffee','le café'],
    ['Hot chocolate','le chocolat chaud',['hot cocoa']], ['Lemonade','la citronnade',[],['la limonade']],
    ['Smoothie','le frappé aux fruits / le smoothie',['smoothies'],['le frappé aux fruits','le smoothie']]
  ]);
  add('snacks', [
    ['Candy','les bonbons',['candies','sweets'],['le bonbon']], ['Pizza','la pizza'], ['French fries','les frites',['fries','chips'],['la frite']],
    ['Donut','le beignet',['doughnut','donuts','doughnuts'],['les beignets']], ['Fast food','le fast-food',[],['le fast food']],
    ['Hamburger','le hamburger',['burger','hamburgers','burgers']], ['Hot dog','le hot dog',['hotdog','hot dogs'],['le hot-dog']],
    ['Potato chips','les chips / les croustilles',['crisps'],['les chips','les croustilles','la croustille']],
    ['Popcorn','le maïs soufflé',[],['le maïs-soufflé'],'Spacing and accents are standardized from Mais-Souffle in the slide.'],
    ['Macaroni and cheese','les macaronis au fromage',['mac and cheese','mac n cheese','macaroni cheese']]
  ]);
  add('pantry', [
    ['Salt','le sel'], ['Sugar','le sucre'], ['Cinnamon','la cannelle'], ['Vanilla','la vanille'], ['Flour','la farine'],
    ['Vinegar','le vinaigre'], ['Baking soda','le bicarbonate de soude',['bicarbonate of soda']],
    ['Baking powder','la levure chimique'], ['Olive oil','l’huile d’olive',[],[],'The slide’s La huile d’olive is corrected to l’huile d’olive.']
  ]);
  words.find(w=>w.en==='Pepper').categories.push('pantry');
  add('describing', [
    ['Healthy eating','l’alimentation saine',['healthy diet','healthy'],['alimentation saine'], 'The slide labels alimentation saine as Healthy. The phrase means healthy eating; the adjective healthy is sain / saine.'],
    ['Unhealthy','malsain / malsaine',[],['malsain','malsaine']],
    ['Delicious','délicieux / délicieuse',[],['délicieux','délicieuse']],
    ['Spicy','piquant / piquante',[],['piquant','piquante','épicé','épicée']],
    ['Salty','salé / salée',[],['salé','salée']], ['Sweet','sucré / sucrée',[],['sucré','sucrée']],
    ['Sour','aigre'], ['Bitter','amer / amère',[],['amer','amère']],
    ['Savoury','savoureux / savoureuse',['savory','tasty','flavourful','flavorful'],['savoureux','savoureuse'],'The slide pairs savoury with savoureux / savoureuse, which means tasty or flavourful. Salé can describe savoury as opposed to sweet.'],
    ['Dried','séché / séchée',['dry'],['séché','séchée'], 'The slide labels Séché as Dry. Séché means dried; sec / sèche means dry.'],
    ['Hot (temperature)','chaud / chaude',['hot','warm'],['chaud','chaude']],
    ['Cold','froid / froide',[],['froid','froide']], ['Bad','mauvais / mauvaise',[],['mauvais','mauvaise']],
    ['Good','bon / bonne',[],['bon','bonne']], ['Gourmet','gourmet']
  ]);
  add('table', [
    ['Pantry','le garde-manger'], ['Restaurant','un restaurant',[],['le restaurant']], ['Buffet','un buffet',[],['le buffet']],
    ['Meal','un repas',['meals'],['le repas']], ['Dish','un plat',['dishes'],['le plat']],
    ['Fork','une fourchette',['forks'],['la fourchette']], ['Knife','un couteau',['knives'],['le couteau']],
    ['Spoon','une cuillère',['spoons'],['la cuillère','une cuiller','la cuiller']],
    ['Glass','un verre',['glasses'],['le verre'], 'The slide’s Une verre is corrected to un verre (masculine).'],
    ['Cup','une tasse',['cups'],['la tasse']], ['Bowl','un bol',['bowls'],['le bol']],
    ['Breakfast','le petit déjeuner',[],['le petit-déjeuner']], ['Lunch','le déjeuner'],
    ['Dinner','le dîner / le souper',['supper'],['le dîner','le souper'], 'Meal names differ by region. This deck follows the slide: breakfast = petit déjeuner; lunch = déjeuner; dinner = dîner / souper.'],
    ['To eat','manger',['eat','eating']], ['To like','aimer',['like','to love','love']],
    ['To dislike','détester',['dislike','to hate','hate'],[], 'The slide uses détester for to dislike. Détester is usually stronger: to hate. Ne pas aimer is another way to say to dislike.']
  ]);
  const data={categories,words};
  root.BOUFFE_DATA=data;
  if(typeof module!=='undefined') module.exports=data;
})(globalThis);
