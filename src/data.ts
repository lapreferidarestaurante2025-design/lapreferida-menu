import { Category, TableConfig } from './types';

export const INITIAL_MENU: Category[] = [
  {
    id: 'entradas',
    name: 'Entradas',
    note: '',
    items: [
      {
        id: 'e1',
        name: 'Picada de bollo',
        price: 10000,
        desc: 'Bollo de la casa, queso costeño, lechuga, picadillo de cilantro y cebolla, papa ripio, salsa de la casa.',
        ing: ['Bollo', 'Queso costeño', 'Lechuga', 'Cilantro', 'Cebolla', 'Papa ripio', 'Salsa'],
        ok: true
      },
      {
        id: 'e2',
        name: 'Chorizo con bollo',
        price: 13000,
        desc: 'Bollo de la casa, chorizo, queso costeño y salsa de la casa.',
        ing: ['Bollo', 'Chorizo', 'Queso costeño', 'Salsa'],
        ok: true
      },
      {
        id: 'e3',
        name: 'Deditos de queso con miel',
        price: 12000,
        desc: 'Deditos rellenos de queso, acompañados con miel.',
        ing: ['Deditos de queso', 'Miel'],
        ok: true
      }
    ]
  },
  {
    id: 'hamburguesas',
    name: 'Hamburguesas',
    note: 'Todas vienen con papas a la francesa',
    items: [
      {
        id: 'h1',
        name: 'Hamburguesa de Pollo',
        price: 25000,
        desc: 'Pan brioche, pollo, lechuga crespa, tomate, cebolla, queso cheddar, salsa de la casa.',
        ing: ['Pan brioche', 'Pollo', 'Lechuga crespa', 'Tomate', 'Cebolla', 'Queso cheddar', 'Salsa'],
        ok: true,
        popular: true
      },
      {
        id: 'h2',
        name: 'Hamburguesa Clásica',
        price: 25000,
        desc: 'Pan brioche, carne, lechuga crespa, tomate, cebolla, queso cheddar, salsa de la casa.',
        ing: ['Pan brioche', 'Carne', 'Lechuga crespa', 'Tomate', 'Cebolla', 'Queso cheddar', 'Salsa'],
        ok: true
      },
      {
        id: 'h3',
        name: 'Hamburguesa Preferida',
        price: 29000,
        desc: 'Pan brioche, carne, tocineta, lechuga crespa, cebolla caramelizada, queso cheddar, salsa de la casa.',
        ing: ['Pan brioche', 'Carne', 'Tocineta', 'Lechuga crespa', 'Cebolla caramelizada', 'Queso cheddar', 'Salsa'],
        ok: true,
        recommended: true,
        popular: true
      }
    ]
  },
  {
    id: 'chuzopan',
    name: 'Chuzo Pan',
    note: '',
    items: [
      {
        id: 'cp1',
        name: 'Chuzo Pan de Pollo',
        price: 25000,
        desc: 'Pan artesanal, pollo, pimentón, cebolla, queso costeño, queso mozzarella, papa ripio, salsa.',
        ing: ['Pan artesanal', 'Pollo', 'Pimentón', 'Cebolla', 'Queso costeño', 'Queso mozzarella', 'Papa ripio', 'Salsa'],
        ok: true
      },
      {
        id: 'cp2',
        name: 'Chuzo Pan Mixto',
        price: 27000,
        desc: 'Pan artesanal, pollo, butifarra, chorizo, salchicha ranchera, pimentón, cebolla, queso costeño, queso mozzarella, papa ripio, salsa.',
        ing: ['Pan artesanal', 'Pollo', 'Butifarra', 'Chorizo', 'Salchicha ranchera', 'Pimentón', 'Cebolla', 'Queso costeño', 'Queso mozzarella', 'Papa ripio', 'Salsa'],
        ok: true,
        recommended: true,
        popular: true
      }
    ]
  },
  {
    id: 'chuzodesg',
    name: 'Chuzo Desgranado',
    note: 'Viene con bollo de la casa',
    items: [
      {
        id: 'cd1',
        name: 'Chuzo Desgranado con Pollo',
        price: 26000,
        desc: 'Bollo, pollo, pimentón, cebolla, queso costeño, papa ripio, salsa.',
        ing: ['Bollo', 'Pollo', 'Pimentón', 'Cebolla', 'Queso costeño', 'Papa ripio', 'Salsa'],
        ok: true
      },
      {
        id: 'cd2',
        name: 'Chuzo Desgranado Mixto',
        price: 28000,
        desc: 'Bollo, pollo, butifarra, chorizo, salchicha ranchera, pimentón, cebolla, queso costeño, papa ripio, salsa.',
        ing: ['Bollo', 'Pollo', 'Butifarra', 'Chorizo', 'Salchicha ranchera', 'Pimentón', 'Cebolla', 'Queso costeño', 'Papa ripio', 'Salsa'],
        ok: true,
        popular: true
      },
      {
        id: 'cd3',
        name: 'Chuzo Desgranado con Carne',
        price: 29000,
        desc: 'Bollo, lomo ancho, pimentón, cebolla, queso costeño, papa ripio, salsa.',
        ing: ['Bollo', 'Lomo ancho', 'Pimentón', 'Cebolla', 'Queso costeño', 'Papa ripio', 'Salsa'],
        ok: true,
        recommended: true
      }
    ]
  },
  {
    id: 'arepa',
    name: 'Arepa Picada',
    note: '',
    items: [
      {
        id: 'ap1',
        name: 'Arepa con Pollo',
        price: 25000,
        desc: 'Arepa de maíz, pollo, pimentón, cebolla, queso costeño, papa ripio, salsa.',
        ing: ['Arepa de maíz', 'Pollo', 'Pimentón', 'Cebolla', 'Queso costeño', 'Papa ripio', 'Salsa'],
        ok: true
      },
      {
        id: 'ap2',
        name: 'Arepa Mixta',
        price: 26000,
        desc: 'Arepa de maíz, pollo, butifarra, chorizo, salchicha ranchera, pimentón, cebolla, queso costeño, papa ripio, salsa.',
        ing: ['Arepa de maíz', 'Pollo', 'Butifarra', 'Chorizo', 'Salchicha ranchera', 'Pimentón', 'Cebolla', 'Queso costeño', 'Papa ripio', 'Salsa'],
        ok: true,
        popular: true
      },
      {
        id: 'ap3',
        name: 'Arepa Picada de Carne',
        price: 28000,
        desc: 'Arepa de maíz, lomo ancho, pimentón, cebolla, queso costeño, papa ripio, salsa.',
        ing: ['Arepa de maíz', 'Lomo ancho', 'Pimentón', 'Cebolla', 'Queso costeño', 'Papa ripio', 'Salsa'],
        ok: true,
        recommended: true
      }
    ]
  },
  {
    id: 'pinchos',
    name: 'Pinchos Palitos',
    note: 'Viene con arepa o bollo',
    items: [
      {
        id: 'pp1',
        name: 'Pincho Palito de Pollo',
        price: 25000,
        desc: 'Pollo, pimentón, cebolla, arepa o bollo, queso costeño, salsa.',
        ing: ['Pollo', 'Pimentón', 'Cebolla', 'Arepa o bollo', 'Queso costeño', 'Salsa'],
        ok: true
      },
      {
        id: 'pp2',
        name: 'Pincho Palito Mixto',
        price: 26000,
        desc: 'Pollo, butifarra, chorizo, pimentón, cebolla, arepa o bollo, queso costeño, salsa.',
        ing: ['Pollo', 'Butifarra', 'Chorizo', 'Pimentón', 'Cebolla', 'Arepa o bollo', 'Queso costeño', 'Salsa'],
        ok: true,
        popular: true
      },
      {
        id: 'pp3',
        name: 'Pincho Palito de Carne',
        price: 28000,
        desc: 'Lomo ancho, pimentón, cebolla, arepa o bollo, queso costeño, salsa.',
        ing: ['Lomo ancho', 'Pimentón', 'Cebolla', 'Arepa o bollo', 'Queso costeño', 'Salsa'],
        ok: true,
        recommended: true
      }
    ]
  },
  {
    id: 'asados',
    name: 'Asados',
    note: '',
    items: [
      {
        id: 'a1',
        name: 'Pechuga',
        price: 30000,
        desc: 'Pechuga asada, papas a la francesa o bollo, ensalada fresca, chimichurri de la casa.',
        ing: ['Pechuga', 'Papas o bollo', 'Ensalada fresca', 'Chimichurri'],
        ok: true
      },
      {
        id: 'a2',
        name: 'Lomo Ancho',
        price: 32000,
        desc: 'Lomo ancho asado, papas a la francesa o bollo, ensalada fresca, chimichurri de la casa.',
        ing: ['Lomo ancho', 'Papas o bollo', 'Ensalada fresca', 'Chimichurri'],
        ok: true,
        recommended: true
      },
      {
        id: 'a3',
        name: 'Mixto',
        price: 34000,
        desc: 'Lomo ancho, pechuga, papas a la francesa o bollo, ensalada fresca, chimichurri.',
        ing: ['Lomo ancho', 'Pechuga', 'Papas o bollo', 'Ensalada fresca', 'Chimichurri'],
        ok: true,
        popular: true
      },
      {
        id: 'a4',
        name: 'Picada Mixta (2-3 personas)',
        price: 57000,
        desc: 'Lomo ancho, pechuga, chorizo, butifarra, queso asado, papas a la francesa, bollo de la casa, salsa.',
        ing: ['Lomo ancho', 'Pechuga', 'Chorizo', 'Butifarra', 'Queso asado', 'Papas', 'Bollo', 'Salsa'],
        ok: true
      }
    ]
  },
  {
    id: 'mazorca',
    name: 'Mazorca Desgranada',
    note: '',
    items: [
      {
        id: 'mz1',
        name: 'Mazorca Desgranada de Pollo',
        price: 26000,
        desc: 'Maíz, pollo, queso mozzarella, pimentón, cebolla, queso costeño, papa ripio, salsa.',
        ing: ['Maíz', 'Pollo', 'Queso mozzarella', 'Pimentón', 'Cebolla', 'Queso costeño', 'Papa ripio', 'Salsa'],
        ok: true
      },
      {
        id: 'mz2',
        name: 'Mazorca Desgranada Mixta',
        price: 28000,
        desc: 'Maíz, pollo, chorizo, butifarra, salchicha ranchera, pimentón, cebolla, queso mozzarella, queso costeño, papa ripio, salsa.',
        ing: ['Maíz', 'Pollo', 'Chorizo', 'Butifarra', 'Salchicha ranchera', 'Pimentón', 'Cebolla', 'Queso mozzarella', 'Queso costeño', 'Papa ripio', 'Salsa'],
        ok: true,
        popular: true,
        recommended: true
      },
      {
        id: 'mz3',
        name: 'Mazorca Desgranada de Carne',
        price: 29000,
        desc: 'Maíz, lomo ancho, queso mozzarella, pimentón, cebolla, queso costeño, papa ripio, salsa.',
        ing: ['Maíz', 'Lomo ancho', 'Queso mozzarella', 'Pimentón', 'Cebolla', 'Queso costeño', 'Papa ripio', 'Salsa'],
        ok: true
      }
    ]
  },
  {
    id: 'salchipapa',
    name: 'Salchipapa',
    note: '',
    items: [
      {
        id: 's1',
        name: 'Salchipapa Sencilla',
        price: 18000,
        desc: 'Papas, lechuga, queso costeño, salchicha sencilla, papa ripio, salsa.',
        ing: ['Papas', 'Lechuga', 'Queso costeño', 'Salchicha sencilla', 'Papa ripio', 'Salsa'],
        ok: true
      },
      {
        id: 's2',
        name: 'Salchipapa Cienaguera',
        price: 20000,
        desc: 'Papas, lechuga, queso costeño, salchicha sencilla, papa ripio, salsa con picadillo de cilantro y cebolla.',
        ing: ['Papas', 'Lechuga', 'Queso costeño', 'Salchicha sencilla', 'Papa ripio', 'Cilantro', 'Cebolla', 'Salsa'],
        ok: true,
        recommended: true
      },
      {
        id: 's3',
        name: 'Salchipapa Ranchera',
        price: 23000,
        desc: 'Papas, lechuga, queso costeño, salchicha ranchera, papa ripio, salsa.',
        ing: ['Papas', 'Lechuga', 'Queso costeño', 'Salchicha ranchera', 'Papa ripio', 'Salsa'],
        ok: true
      },
      {
        id: 's4',
        name: 'Salchipapa Ranchi-pollo',
        price: 25000,
        desc: 'Papas, lechuga, queso costeño, salchicha ranchera, pollo, papa ripio, salsa.',
        ing: ['Papas', 'Lechuga', 'Queso costeño', 'Salchicha ranchera', 'Pollo', 'Papa ripio', 'Salsa'],
        ok: true,
        popular: true
      },
      {
        id: 's5',
        name: 'Salchipapa Suiza',
        price: 26050, // Let's use 26000 or the custom
        desc: 'Papas, lechuga, queso costeño, salchicha suiza, papa ripio, salsa.',
        ing: ['Papas', 'Lechuga', 'Queso costeño', 'Salchicha suiza', 'Papa ripio', 'Salsa'],
        ok: true
      },
      {
        id: 's6',
        name: 'Salchipapa Pollo',
        price: 25000,
        desc: 'Papas, lechuga, queso costeño, pollo, papa ripio, salsa.',
        ing: ['Papas', 'Lechuga', 'Queso costeño', 'Pollo', 'Papa ripio', 'Salsa'],
        ok: true
      },
      {
        id: 's7',
        name: 'Salchipapa Mixta',
        price: 28000,
        desc: 'Papas, lechuga, queso costeño, salchicha ranchera, butifarra, pollo, chorizo, papa ripio, salsa.',
        ing: ['Papas', 'Lechuga', 'Queso costeño', 'Salchicha ranchera', 'Butifarra', 'Pollo', 'Chorizo', 'Papa ripio', 'Salsa'],
        ok: true,
        popular: true
      },
      {
        id: 's8',
        name: 'Salchipapa Preferida',
        price: 35000,
        desc: 'Papas, lechuga, queso costeño, carne, salchicha ranchera, butifarra, pollo, chorizo, maíz, queso mozzarella, papa ripio, salsa.',
        ing: ['Papas', 'Lechuga', 'Queso costeño', 'Carne', 'Salchicha ranchera', 'Butifarra', 'Pollo', 'Chorizo', 'Maíz', 'Queso mozzarella', 'Papa ripio', 'Salsa'],
        ok: true,
        recommended: true,
        popular: true
      }
    ]
  },
  {
    id: 'perros',
    name: 'Perros Calientes',
    note: '',
    items: [
      {
        id: 'pc1',
        name: 'Perro Ranchero Grande',
        price: 18000,
        desc: 'Pan artesanal, salchicha ranchera, queso costeño, papa ripio, salsa rosada, tártara y cebolla.',
        ing: ['Pan artesanal', 'Salchicha ranchera', 'Queso costeño', 'Papa ripio', 'Salsa rosada', 'Salsa tártara', 'Salsa cebolla'],
        ok: true,
        popular: true
      },
      {
        id: 'pc2',
        name: 'Perro Suizo',
        price: 22000,
        desc: 'Pan artesanal, salchicha suiza, queso costeño, papa ripio, salsa rosada, mostaza, tártara y cebolla.',
        ing: ['Pan artesanal', 'Salchicha suiza', 'Queso costeño', 'Papa ripio', 'Salsa rosada', 'Mostaza', 'Salsa tártara', 'Salsa cebolla'],
        ok: true,
        recommended: true
      }
    ]
  },
  {
    id: 'infantil',
    name: 'Menú Infantil',
    note: '',
    items: [
      {
        id: 'i1',
        name: 'Salchipapa sin verduras',
        price: 14000,
        desc: 'Papas a la francesa, queso costeño, salchicha sencilla, salsa de la casa.',
        ing: ['Papas a la francesa', 'Queso costeño', 'Salchicha sencilla', 'Salsa de la casa'],
        ok: true
      },
      {
        id: 'i2',
        name: 'Nuggets de pollo',
        price: 17000,
        desc: '6 Nuggets de pollo, papas a la francesa, salsa de la casa.',
        ing: ['Nuggets de pollo (x6)', 'Papas a la francesa', 'Salsa de la casa'],
        ok: true,
        recommended: true
      }
    ]
  },
  {
    id: 'adiciones',
    name: 'Adiciones',
    note: '',
    items: [
      {
        id: 'ad1',
        name: 'Arepa',
        price: 3500,
        desc: 'Arepa adicional.',
        ing: ['Arepa'],
        ok: true
      },
      {
        id: 'ad2',
        name: 'Queso Costeño',
        price: 3500,
        desc: 'Porción de queso costeño.',
        ing: ['Queso costeño'],
        ok: true
      },
      {
        id: 'ad3',
        name: 'Salchicha Tipo Ranchera',
        price: 4500,
        desc: 'Salchicha tipo ranchera adicional.',
        ing: ['Salchicha ranchera'],
        ok: true
      },
      {
        id: 'ad4',
        name: 'Butifarra',
        price: 4500,
        desc: 'Porción de butifarra.',
        ing: ['Butifarra'],
        ok: true
      },
      {
        id: 'ad5',
        name: 'Chorizo',
        price: 4500,
        desc: 'Porción de chorizo.',
        ing: ['Chorizo'],
        ok: true
      },
      {
        id: 'ad6',
        name: 'Queso Mozzarella Fundido',
        price: 6500,
        desc: 'Queso mozzarella fundido.',
        ing: ['Queso mozzarella'],
        ok: true
      },
      {
        id: 'ad7',
        name: 'Bollo',
        price: 5500,
        desc: 'Bollo de la casa adicional.',
        ing: ['Bollo'],
        ok: true
      },
      {
        id: 'ad8',
        name: 'Pollo',
        price: 8000,
        desc: 'Porción de pollo adicional.',
        ing: ['Pollo'],
        ok: true
      },
      {
        id: 'ad9',
        name: 'Maicito',
        price: 7000,
        desc: 'Porción de maíz.',
        ing: ['Maíz'],
        ok: true
      },
      {
        id: 'ad10',
        name: 'Tocineta',
        price: 7500,
        desc: 'Porción de tocineta.',
        ing: ['Tocineta'],
        ok: true
      },
      {
        id: 'ad11',
        name: 'Papas A La Francesa',
        price: 9000,
        desc: 'Porción de papas a la francesa.',
        ing: ['Papas'],
        ok: true
      },
      {
        id: 'ad12',
        name: 'Carne Angus',
        price: 8000,
        desc: 'Adicional de carne angus.',
        ing: ['Carne Angus'],
        ok: true
      }
    ]
  },
  {
    id: 'bebidas',
    name: 'Bebidas',
    note: '',
    items: [
      {
        id: 'b1',
        name: 'Vaso Michelado',
        price: 3500,
        desc: 'Vaso michelado de la casa.',
        ing: ['Cerveza', 'Limón', 'Sal', 'Salsas'],
        ok: true
      },
      {
        id: 'b2',
        name: 'Bretaña 300ml',
        price: 4500,
        desc: 'Bretaña 300ml.',
        ing: ['Bretaña'],
        ok: true
      },
      {
        id: 'b3',
        name: 'Gaseosa Postobón 400ml',
        price: 4500,
        desc: 'Gaseosa Postobón 400ml.',
        ing: ['Postobón'],
        ok: true
      },
      {
        id: 'b4',
        name: 'Agua Brisa',
        price: 4500,
        desc: 'Agua Brisa.',
        ing: ['Agua'],
        ok: true
      },
      {
        id: 'b5',
        name: 'Soda Hatsu',
        price: 5500,
        desc: 'Soda Hatsu.',
        ing: ['Hatsu'],
        ok: true,
        popular: true
      },
      {
        id: 'b6',
        name: 'Jugos Hit 500ml',
        price: 5500,
        desc: 'Jugos Hit 500ml y sabores variados.',
        ing: ['Hit'],
        ok: true
      },
      {
        id: 'b7',
        name: 'Mr Tea',
        price: 5500,
        desc: 'Te límon frío Mr Tea.',
        ing: ['Mr Tea'],
        ok: true
      },
      {
        id: 'b8',
        name: 'Coca-Cola 400ml',
        price: 5500,
        desc: 'Coca-Cola 400ml helada.',
        ing: ['Coca-Cola helada'],
        ok: true,
        popular: true
      },
      {
        id: 'b9',
        name: 'Coca-Cola Zero',
        price: 5500,
        desc: 'Coca-Cola Zero sin azúcares.',
        ing: ['Coca-Cola Zero'],
        ok: true
      },
      {
        id: 'b10',
        name: 'Kola Román 400ml',
        price: 5500,
        desc: 'Kola Román 400ml helada.',
        ing: ['Kola Román'],
        ok: true,
        recommended: true
      },
      {
        id: 'b11',
        name: 'Agua Saborizada 600ml',
        price: 5500,
        desc: 'Agua saborizada 600ml refrescante.',
        ing: ['Agua saborizada'],
        ok: true
      },
      {
        id: 'b12',
        name: 'Quatro 400ml',
        price: 5500,
        desc: 'Quatro sabor Toronja 400ml.',
        ing: ['Quatro'],
        ok: true
      },
      {
        id: 'b13',
        name: 'Sprite 400ml',
        price: 5500,
        desc: 'Sprite refrescante sabor lima-limón.',
        ing: ['Sprite'],
        ok: true
      },
      {
        id: 'b14',
        name: 'Ginger',
        price: 5500,
        desc: 'Agua tónica Ginger refrescante.',
        ing: ['Ginger'],
        ok: true
      },
      {
        id: 'b15',
        name: 'Fuze Tea',
        price: 7000,
        desc: 'Té Fuze Tea sabor durazno o limón.',
        ing: ['Fuze Tea'],
        ok: true
      },
      {
        id: 'b16',
        name: 'Té Hatsu',
        price: 9500,
        desc: 'Té Premium Hatsu de variados sabores.',
        ing: ['Té Hatsu'],
        ok: true,
        recommended: true
      }
    ]
  }
];

export const INITIAL_TABLES: TableConfig[] = [
  { id: '1', name: 'Mesa 1 (Central)', capacity: 4, x: 25, y: 25 },
  { id: '2', name: 'Mesa 2 (Parejas)', capacity: 2, x: 55, y: 25 },
  { id: '3', name: 'Mesa 3 (Grupal)', capacity: 4, x: 80, y: 25 },
  { id: '4', name: 'Mesa 4 (Familiar)', capacity: 6, x: 25, y: 65 },
  { id: '5', name: 'Mesa 5 (Parejas)', capacity: 2, x: 55, y: 65 },
  { id: '6', name: 'Mesa 6 (Parrillera)', capacity: 4, x: 80, y: 65 }
];

export const ADICIONES_LIST = [
  { name: 'Adición de Arepa', price: 3500 },
  { name: 'Adición de Queso Costeño', price: 3500 },
  { name: 'Adición de Salchicha Tipo Ranchera', price: 4500 },
  { name: 'Adición de Butifarra', price: 4500 },
  { name: 'Adición de Chorizo', price: 4500 },
  { name: 'Adición de Queso Mozzarella Fundido', price: 6500 },
  { name: 'Adición de Bollo', price: 5500 },
  { name: 'Adición de Pollo', price: 8000 },
  { name: 'Adición de Maicito', price: 7000 },
  { name: 'Adición de Tocineta', price: 7500 },
  { name: 'Adición de Papas A La Francesa', price: 9000 },
  { name: 'Adición de Carne Angus', price: 8000 }
];

export const HOLIDAYS = [
  '2026-01-01',
  '2026-01-05',
  '2026-01-12',
  '2026-03-23',
  '2026-04-02',
  '2026-04-03',
  '2026-05-01',
  '2026-05-18',
  '2026-06-15',
  '2026-06-22',
  '2026-06-29',
  '2026-07-20',
  '2026-08-07',
  '2026-08-17',
  '2026-10-12',
  '2026-11-02',
  '2026-11-16',
  '2026-12-08',
  '2026-12-25'
];

export const CIENAGA_ZONES = [
  {
    id: 'cerca',
    name: 'Zona Urbana / Cerca (Hasta 1 km)',
    cost: 3000,
    distanceRange: 'Hasta 1.0 km',
    barrios: 'Centro, Barrio Abajo, Las Delicias, Plaza Centenario, Olaya Herrera, Alrededores',
    colorHex: '#10b981' // Green
  },
  {
    id: 'lejos',
    name: 'Zona Periférica / Lejos (Más de 1 km)',
    cost: 4000,
    distanceRange: 'Más de 1.0 km',
    barrios: 'Costa Verde, Miramar, Kennedy, Córdoba, Alianzas, La Floresta, San Juan, El Progreso, etc.',
    colorHex: '#f59e0b' // Amber
  }
];
