export const uploadImagemCloudinary = async (ficheiro) => {
    const formData = new FormData();
    formData.append("file", ficheiro);
    formData.append("upload_preset", "exercicios_upload");
    formData.append("cloud_name", "dnclesvlz");
  
    const res = await fetch("https://api.cloudinary.com/v1_1/dnclesvlz/image/upload", {
      method: "POST",
      body: formData,
    });
  
    const data = await res.json();
  
    if (!data.secure_url) {
      throw new Error("Erro ao carregar imagem para o Cloudinary");
    }
  
    return data.secure_url;
  };
  