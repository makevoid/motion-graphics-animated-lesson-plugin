# Still background prompts

Generate only the settings selected for the lesson, inside its project after production authorization. These are reconstruction briefs, not byte-identical copies of the original images. Use the configured image model and the approved style; inspect the result before saving it at `.skill/assets/lesson/plates/<name>.png` or updating `plate_file:` to its output path. Do not generate at installation time.

Shared style: premium 2D cartoon, clean dark plum-black outlines #1B1A22, warm cel shading, matte surfaces and subtle warm rim light. No people, lettering, logos, captions or watermarks. Keep teaching areas blank so p5 can draw exact text. Frame at 16:9 for a 1920×1080 scene; remeasure all composition coordinates on the new image.

## classroom.png

Empty welcoming university lecture hall viewed straight toward a large dark slate-green chalkboard #1E3B34 with a warm wooden frame. Three brass pendant lamps, a wooden lectern at lower left, bookshelves and plants at the left edge, a tall arched window at right admitting golden afternoon light. Wide clear wooden teaching stage below the board, a few desk backs at the bottom foreground. Keep the board and central stage unobstructed. Aim for the board rectangle x237 y87 w1430 h529, stage around y874 and foreground desks below y900 in 1920×1080 coordinates. Do not draw chalk writing, equations, labels or people. Review and update p5 bounds if the generated framing differs.

## developer-room.png

Empty cozy late-night developer workspace in the same cel cartoon style. Broad wooden desk across the bottom, two dark blank monitors on the right half, a warm amber desk lamp, a plain mug, a few books and blank sticky notes. Deep blue walls and a window with a quiet city skyline at night. Leave the left half and foreground clear for a separately composited developer and code cards. No person, writing, readable code, brand marks or bright green props.

## agent-lab.png

Empty cartoon research laboratory matching the accepted classroom and developer-room plates. Warm workbenches, friendly abstract machines, cable runs and blank display panels; clear central staging space for separate characters and diagrams. Keep every screen and label blank. Attach the newly approved plates as style references when available. No people, logos or generated lettering.
