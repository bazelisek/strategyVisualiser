import { useState } from "react";

export default function UploadImage({
  className,
  onFileSelected,
}: {
  className?: string;
  onFileSelected: (file: File) => void;
}) {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  function handleSubmitFile(file: File) {
    setSelectedImage(file);
    onFileSelected(file);
  }

  return (
    <input
      className={className}
      type="file"
      name="myImage"
      accept="image/jpg, image/png, image/jpeg"
      onChange={(event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        handleSubmitFile(file);
      }}
    />
  );
}
