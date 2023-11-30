# howtos

This folder contains small examples that illustrate individual concepts / techniques. The howtos in this directory are presented in a few different ways:

- The `main.verbose.js` file in each demo contains both the WebGPU JavaScript and all the WGSL shaders (in JS strings) in a single, heavily commented file.
These files are the best places to go to understand how seagulls work.
- When viewing each demo, you can switch between the various JavaScript files and shader files used.
- the `main.js`, `frag.wgsl`, and `compute.wgsl` files are minimal, non-commented files that are designed to be terse and readable.

1. [*Simplest*](https://charlieroberts.github.io/seagulls/howtos/1_simplest) - the smallest seagulls project needed to get a fullscreen fragment shader presented on screen.
2. [*One Uniform*](https://charlieroberts.github.io/seagulls/howtos/2_one_uniform) - adding a single uniform to a fragment shader, and setting up the CPU to use it for communication with the GPU
3. [*Using coordinates*](https://charlieroberts.github.io/seagulls/howtos/3_using_coordinates) - by passing the canvas resolution to our shader as a uniform, we can create normalized coordinates for each pixel we're operating on.
4. [*Mouse coordinates*](https://charlieroberts.github.io/seagulls/howtos/4_mouse_coordinates) - sending mouse position and left click status to the fragment shader as a uniform
5. [*Tweakpane*](https://charlieroberts.github.io/seagulls/howtos/5_tweakpane) using the Tweakpane system to add a GUI to control our shader
6. [*Audio*](https://charlieroberts.github.io/seagulls/howtos/6_audio) - using the Audio helper to send FFT analysis of incoming audio to seagulls to the fragment shader.
7. [*Read texture*](https://charlieroberts.github.io/seagulls/howtos/7_readtexture) - Read from a texture.
8. [*Feedback*](https://charlieroberts.github.io/seagulls/howtos/8_feedback) - a simple mouse-driven feedback example.
9. [*Video Feedback*](https://charlieroberts.github.io/seagulls/howtos/9_video_feedback) - how to use live video feeds + feedback together
10. [*Simplest Compute*](https://charlieroberts.github.io/seagulls/howtos/10_simplest_compute) - Using a compute shader to incremeent a single number, which in turn is used to determine the color of all pixels in a fragment shader.
11. [*Compute with position*](https://charlieroberts.github.io/seagulls/howtos/11_compute_with_position) - Performing compute shader computations for every pixel on the screen.
12. [*Particle*](https://charlieroberts.github.io/seagulls/howtos/12_particle) - A single instanced particle drawn with a vertex shader.
13. [*Many particles*](https://charlieroberts.github.io/seagulls/howtos/13_many_particles) - Many particles driven by compute + vertex shaders.
14. [*Post-processing*](https://charlieroberts.github.io/seagulls/howtos/14_postprocessing) - Demonstrates how to render to texture and then color process the results.
15. [*Multipass post-processing*](https://charlieroberts.github.io/seagulls/howtos/15_postprocessing_twopassblur) -A two-pass gaussian blur post-processing effect.
