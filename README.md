# Movie Browser App

A responsive movie browsing page built with:

- HTML
- CSS
- Vanilla JavaScript
- Fetch API

The UI is inspired by the provided design and focuses first on the core functionality required in the assignment.

---

## How to run the project

Because this project is plain HTML/CSS/JavaScript, you can run it in either of these ways:

### Option 1
Open `index.html` directly in your browser.

### Option 2
Use a local server (recommended)

---

## Features completed

- Show a horizontal list of movies on page load
- First movie is selected by default
- Show selected movie details:
  - title
  - IMDb rating
  - year
  - duration
  - genre
- Hover on desktop previews movie data
- Click selects a movie
- Mouse leave returns to last selected movie
- Background updates based on current movie
- Search works when pressing Enter
- Loading state
- Error state
- Empty state
- Responsive layout for mobile, tablet, and desktop
- Left/right carousel buttons with smooth scroll
- Handles missing movie data safely

---

## Assumptions

- I assumed the API search endpoint returns a list of titles in a structure that may vary slightly, so I normalized multiple possible field names in JavaScript.
- I assumed poster/background image can come from the same image field.
- I assumed using the first 20 results is acceptable for both default load and search results.

---

## Known limitations

- Carousel does not loop infinitely.
- The exact visual result may differ slightly from the Figma design because I focused on functionality first.
- Some API records may not include complete fields such as runtime, genre, or description.
- If the API response shape changes significantly, the normalization logic may need a small update.

---

## Progress

### Completed
Most of the assignment requirements were implemented, especially the main functional requirements:
movie list, selected movie, hover/click behavior, background update, search, states, responsiveness, and carousel buttons.

### Not completed fully
- Pixel-perfect design matching may still need minor spacing and sizing refinements.
- More advanced carousel polish could be added if needed.

---

## Challenges faced

The hardest part was making the app stable while handling:
- hover preview vs selected movie state
- different screen sizes
- possibly missing movie fields from the API
- keeping the code simple without using frameworks
