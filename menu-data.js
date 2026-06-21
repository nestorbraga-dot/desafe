const DEFAULT_CATEGORIES = [
  { id: 'burgers', name: 'Hambúrgueres', icon: '🍔' },
  { id: 'sides', name: 'Acompanhamentos', icon: '🍟' },
  { id: 'drinks', name: 'Bebidas', icon: '🥤' },
  { id: 'desserts', name: 'Sobremesas', icon: '🍦' }
];

const DEFAULT_PRODUCTS = [
  {
    id: 'prod-1',
    name: 'Monster Cheddar Bacon',
    description: 'Pão brioche selado na manteiga, dois blends artesanais de 150g, muito cheddar cremoso derretido e tiras crocantes de bacon premium.',
    price: 38.90,
    category: 'burgers',
    image: 'assets/monster_cheddar.png',
    available: true,
    tags: ['Mais Pedido', 'Carne 150g']
  },
  {
    id: 'prod-2',
    name: 'Smash Duplo Salad',
    description: 'Pão brioche, dois blends smash de 80g ultra prensados com crostinha, queijo prato duplo, alface americana fresca, tomate e maionese da casa.',
    price: 29.90,
    category: 'burgers',
    image: 'assets/smash_salada.png',
    available: true,
    tags: ['Clássico']
  },
  {
    id: 'prod-3',
    name: 'Gourmet Gorgonzola',
    description: 'Pão de brioche, blend de costela de 180g, creme de queijo gorgonzola artesanal e cebola caramelizada na cerveja preta.',
    price: 42.00,
    category: 'burgers',
    image: 'assets/gorgonzola_gourmet.png',
    available: true,
    tags: ['Premium']
  },
  {
    id: 'prod-4',
    name: 'Batata Rústica da Casa',
    description: 'Porção generosa de batatas rústicas fritas com casca, temperadas com sal marinho, alecrim fresco e páprica defumada. Acompanha maionese verde.',
    price: 19.90,
    category: 'sides',
    image: 'assets/batata_rustica.png',
    available: true,
    tags: ['Crocante']
  },
  {
    id: 'prod-5',
    name: 'Anéis de Cebola (Onion Rings)',
    description: 'Anéis de cebola gigantes empanados em farinha panko super crocante. Acompanha molho barbecue artesanal.',
    price: 18.50,
    category: 'sides',
    image: 'assets/onion_rings.png',
    available: true,
    tags: ['Vegetariano']
  },
  {
    id: 'prod-6',
    name: 'Pink Lemonade Artesanal',
    description: 'Suco de limão siciliano espremido na hora com um toque especial de xarope artesanal de amora e cranberry. Refrescante e doce na medida certa.',
    price: 12.00,
    category: 'drinks',
    image: 'assets/pink_lemonade.png',
    available: true,
    tags: ['Gelado', 'Sem Álcool']
  },
  {
    id: 'prod-7',
    name: 'Refrigerante Lata',
    description: 'Lata de 350ml trincando de gelada. Escolha entre Coca-Cola, Guaraná Antarctica ou Fanta Laranja.',
    price: 6.50,
    category: 'drinks',
    image: 'assets/refrigerante.png',
    available: true,
    tags: ['Lata']
  },
  {
    id: 'prod-8',
    name: 'Milkshake de Nutella Real',
    description: 'Milkshake cremoso de sorvete de baunilha batido com muita Nutella legítima, finalizado com chantilly e calda de chocolate belga.',
    price: 22.00,
    category: 'desserts',
    image: 'assets/milkshake_nutella.png',
    available: true,
    tags: ['Sucesso de Vendas']
  },
  {
    id: 'prod-9',
    name: 'Taça Brownie Supremo',
    description: 'Pedaços quentes de brownie fudge artesanal, sorvete de creme, morangos frescos fatiados, raspas de chocolate meio amargo e muita calda quente.',
    price: 24.90,
    category: 'desserts',
    image: 'assets/taca_brownie.png',
    available: true,
    tags: ['Doce']
  }
];
