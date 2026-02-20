How to use your own dental 3D model (OBJ)
==========================================

1. Put your .obj file in this folder (the "public" folder).

2. Rename it to:  dental-model.obj

3. If you have a .mtl (material) file:
   - Put it in this same folder
   - Rename it to:  dental-model.mtl
   - The app will load it automatically with the OBJ.

4. Restart the dev server (npm run dev) or refresh the page.
   The 3D viewer will show your model instead of the built-in one.

File locations:
  public/dental-model.obj   (required)
  public/dental-model.mtl   (optional)
