# Asteroids

Clon del clásico arcade **Asteroids** implementado en canvas HTML5 puro, sin dependencias ni bundler.

## Descripción

Nave espacial en un campo de asteroides con envolvimiento de bordes (el espacio es toroidal). Destruye asteroides para sumar puntos: los grandes se parten en medianos, los medianos en pequeños. Algunos asteroides grandes pueden soltar el power-up `velocidad`. También pueden cruzar la pantalla estrellas fugaces rápidas que desaparecen solas tras unos segundos y activan `triple shot` si las destruyes.

## Tecnologías

- **HTML5 Canvas** — renderizado 2D
- **JavaScript (ES6+)** — lógica del juego en un solo archivo `game.js`
- Sin frameworks, sin bundler, sin dependencias

## Cómo correr

Abre `index.html` directamente en el navegador (doble clic), o usa un servidor local:

```bash
npx serve .
```

Luego visita `http://localhost:3000`.

## Controles

| Tecla     | Acción     |
| --------- | ---------- |
| `←` `→`   | Rotar nave |
| `↑`       | Propulsar  |
| `Espacio` | Disparar   |
| `C`       | Cambiar skin de la nave |
| `S`       | Activar escudo por 1000 puntos |

## Puntuación

| Asteroide | Puntos |
| --------- | ------ |
| Grande    | 20     |
| Mediano   | 50     |
| Pequeño   | 100    |
| Estrella fugaz | 200 |

## Características

- 3 vidas con invencibilidad temporal al reaparecer (parpadeo)
- Asteroides se parten en fragmentos más pequeños al ser destruidos
- Partículas de explosión al destruir asteroides
- Power-up `velocidad`: puede caer al destruir asteroides grandes, desaparece tras 10 segundos y duplica la propulsión de la nave durante 5 segundos acumulables
- Estrella fugaz: aparece periódicamente, cruza la pantalla a gran velocidad con forma de cometa amarillo, desaparece con el tiempo, otorga puntos y activa `triple shot` durante 5 segundos acumulables si la destruyes
- `Triple shot`: dispara tres balas en distintas direcciones desde el centro, con una apertura de 30 grados a cada lado mientras el efecto está activo
- Skins de nave: cambia entre `CLASICA`, `DELTA`, `VIBORA` y `MORADA` con la tecla `C`; la nave morada es el doble de grande y duplica los puntos obtenidos
- Escudo manual: presiona `S` para gastar 1000 puntos y activar durante 45 segundos una protección que absorbe impactos con asteroides o estrellas fugaces; cada impacto destruye y puntúa el peligro absorbido

## Automatizaciones de GitHub

El repositorio incluye dos workflows para ayudar con la revisión y organización de cambios:

- **Asistente de OpenCode** (`.github/workflows/opencode.yml`): se activa cuando alguien comenta en un issue o en una revisión de pull request usando `/oc` o `/opencode`. OpenCode analiza el contexto y puede responder solicitudes como explicar un problema, revisar una propuesta o sugerir una solución.
- **Triage y enriquecimiento automático de issues** (`.github/workflows/issue-labeler.yml`): se ejecuta al crear un nuevo issue. OpenCode lee el título, el contenido y el repositorio para asignar una o dos etiquetas (`bug`, `enhancement`, `question` o `documentation`) y reorganizar únicamente la descripción, conservando la intención y el contexto originales sin inventar información.

Ambos workflows utilizan OpenCode y requieren que el repositorio tenga configurado el secreto `OPENAI_API_KEY` en GitHub Actions. Para que el triage pueda leer y actualizar issues, también debe estar instalada la aplicación de GitHub de OpenCode en el repositorio. La autenticación con GitHub se realiza mediante OIDC y el token temporal de esa aplicación; no se usa `GITHUB_TOKEN`, `GH_TOKEN` ni un token personal. La publicación y activación de estos workflows se realiza manualmente.
