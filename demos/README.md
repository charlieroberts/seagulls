# Seagulls.js demos

1. [*Simplest*](https://charlieroberts.github.io/seagulls/demos/1_simplest) - the smallest seagulls project needed to get a fullscreen fragment shader presented on screen.
2. [*One Uniform*](https://charlieroberts.github.io/seagulls/demos/2_one_uniform) - adding a single uniform to a fragment shader, and setting up the CPU to use it for communication with the GPU
3. [*Using coordinates*](https://charlieroberts.github.io/seagulls/demos/3_using_coordinates) - by passing the canvas resolution to our shader as a uniform, we can create normalized coordinates for each pixel we're operating on.
4. [*Mouse coordinates*](https://charlieroberts.github.io/seagulls/demos/4_mouse_coordinates) - sending mouse position and left click status to the fragment shader as a uniform
5. [*Tweakpane*](https://charlieroberts.github.io/seagulls/demos/5_tweakpane) using the Tweakpane system to add a GUI to control our shader
6. [*Audio*](https://charlieroberts.github.io/seagulls/demos/6_audio) - using the Audio helper to send FFT analysis of incoming audio to seagulls to the fragment shader.
7. [*Feedback*](https://charlieroberts.github.io/seagulls/demos/7_feedback) - a simple mouse-driven feedback example.
8. [*Video Feedback*](https://charlieroberts.github.io/seagulls/demos/8_video_feedback) - how to use live video feeds + feedback together
9. [*Simplest Compute*](https://charlieroberts.github.io/seagulls/demos/9_simplest_compute) - Using a compute shader to incremeent a single number, which in turn is used to determine the color of all pixels in a fragment shader.
10. [*Compute with position*](https://charlieroberts.github.io/seagulls/demos/10_compute_with_position) - Performing compute shader computations for every pixel on the screen.
11. [*Conway's Game of Life*](https://charlieroberts.github.io/seagulls/demos/11_game_of_life) - A classic artificial life simulation, GPU accelerated.

The demos in this directory are presented in a few different ways:

- The `main.verbose.js` file in each demo contains both the WebGPU JavaScript and all the WGSL shaders (in JS strings) in a single, heavily commented file.
These files are the best places to go to understand how seagulls work.
- When viewing each demo, you can switch between the various JavaScript files and shader files used.
- the `main.js`, `frag.wgsl`, and `compute.wgsl` files are minimal, non-commented files that are designed to be terse and readable.
