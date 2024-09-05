const express = require('express');
const swaggerUi = require('swagger-ui-express');
const fs = require('fs');
const yaml = require('yaml');

const app = express();
app.use(express.json()); // Middleware para manejar JSON

// Cargar el archivo swagger.yaml
const swaggerFile = fs.readFileSync('./swagger.yaml', 'utf8');
const swaggerDocument = yaml.parse(swaggerFile);

// Configuración de Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Middleware para verificar si el cliente quiere la respuesta en YAML
function checkAcceptHeader(req, res, next) {
  const acceptHeader = req.headers['accept'];
  if (acceptHeader && acceptHeader.includes('application/x-yaml')) {
    req.wantsYAML = true;
  } else {
    req.wantsYAML = false;
  }
  next();
}

app.use(checkAcceptHeader);

// "Base de datos" en memoria (un array de jugadores)
let jugadores = [
  { id: 1, nombre: "Lionel Messi", posicion: "Delantero", numero: 10, equipo: "Inter Miami" },
  { id: 2, nombre: "Cristiano Ronaldo", posicion: "Delantero", numero: 7, equipo: "Al Nassr" }
];

// Helper function para convertir respuestas a YAML si se requiere
function sendResponse(res, obj) {
  if (res.req.wantsYAML) {
    res.setHeader('Content-Type', 'application/x-yaml');
    res.send(yaml.stringify(obj));
  } else {
    res.json(obj);
  }
}

// Endpoints

// GET - Obtener todos los jugadores
app.get('/jugadores', (req, res) => {
  sendResponse(res, jugadores);
});

// POST - Añadir un nuevo jugador
app.post('/jugadores', (req, res) => {
  const { nombre, posicion, numero, equipo } = req.body;

  if (!nombre || !posicion || typeof numero !== 'number' || !equipo) {
    return sendResponse(res, { error: 'Debe proporcionar todos los campos: nombre, posición, número, equipo.' });
  }

  const nuevoJugador = {
    id: jugadores.length + 1,
    nombre,
    posicion,
    numero,
    equipo
  };

  jugadores.push(nuevoJugador);
  sendResponse(res, { message: 'Jugador añadido.', jugador: nuevoJugador });
});

// PUT - Reemplazar todos los jugadores
app.put('/jugadores', (req, res) => {
  const { nuevosJugadores } = req.body;

  if (!Array.isArray(nuevosJugadores) || nuevosJugadores.some(j => !j.nombre || !j.posicion || typeof j.numero !== 'number' || !j.equipo)) {
    return sendResponse(res, { error: 'Debe enviar un arreglo de jugadores válidos.' });
  }

  jugadores = nuevosJugadores.map((jugador, index) => ({ id: index + 1, ...jugador }));
  sendResponse(res, { message: 'Jugadores reemplazados.', jugadores });
});

// PATCH - Actualizar parcialmente un jugador
app.patch('/jugadores/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const { nombre, posicion, numero, equipo } = req.body;

  const jugador = jugadores.find(j => j.id === id);

  if (!jugador) {
    return sendResponse(res, { error: 'Jugador no encontrado.' });
  }

  if (nombre) jugador.nombre = nombre;
  if (posicion) jugador.posicion = posicion;
  if (typeof numero === 'number') jugador.numero = numero;
  if (equipo) jugador.equipo = equipo;

  sendResponse(res, { message: `Jugador con id ${id} actualizado.`, jugador });
});

// DELETE - Eliminar un jugador por ID
app.delete('/jugadores/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = jugadores.findIndex(j => j.id === id);

  if (index === -1) {
    return sendResponse(res, { error: 'Jugador no encontrado.' });
  }

  jugadores.splice(index, 1); // Eliminar el jugador
  sendResponse(res, { message: `Jugador con id ${id} eliminado.`, jugadores });
});

// Inicialización del servidor
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
  console.log(`Documentación Swagger disponible en http://localhost:${PORT}/api-docs`);
});
