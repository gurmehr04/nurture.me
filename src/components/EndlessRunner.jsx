import React, { useState } from "react";

const EndlessRunner = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [unityInstance, setUnityInstance] = useState(null);

  const openModal = () => {
    setIsModalOpen(true);
    setTimeout(() => initializeUnity(), 0); // Delay to ensure modal is rendered
  };

  const closeModal = async () => {
    if (unityInstance) {
      try {
        await unityInstance.Quit(); // Cleanly unload Unity instance
        setUnityInstance(null); // Reset the Unity instance state
      } catch (err) {
        console.error("Error while quitting Unity instance:", err);
      }
    }
    setIsModalOpen(false);
  };

  const initializeUnity = () => {
    const buildUrl = "EndlessRunner";
    const loaderUrl = `${buildUrl}/EndlessRunner.loader.js`;
    const canvas = document.querySelector("#unity-canvas");

    const config = {
      dataUrl: `${buildUrl}/EndlessRunner.data`,
      frameworkUrl: `${buildUrl}/EndlessRunner.framework.js`,
      codeUrl: `${buildUrl}/EndlessRunner.wasm`,
      streamingAssetsUrl: "StreamingAssets",
      companyName: "DefaultCompany",
      productName: "Roll a Ball",
      productVersion: "1.0.0",
      matchWebGLToCanvasSize: false,
    };

    const devicePixelRatio = window.devicePixelRatio || 1;
    const width = 800; // Desired width
    const height = 450; // Desired height

    canvas.width = width * devicePixelRatio;
    canvas.height = height * devicePixelRatio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const script = document.createElement("script");
    script.src = loaderUrl;
    script.onload = () => {
      createUnityInstance(canvas, config, (progress) => {
        document.querySelector("#progress-bar").style.width = `${100 * progress}%`;
      })
        .then((instance) => {
          setUnityInstance(instance); // Save Unity instance for later reference
        })
        .catch((message) => alert(message));
    };
    document.body.appendChild(script);
  };

  return (
    <div>
      {/* Play Button */}
      <button onClick={openModal} style={{ padding: "10px 20px", fontSize: "16px" }}
      className="px-6 py-3 bg-yellow-500 text-white font-semibold text-lg rounded-md shadow-md hover:bg-yellow-600 hover:shadow-lg transition-all"
      >
        Play Game
      </button>

      {/* Modal Container */}
      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              position: "relative",
              backgroundColor: "#fff",
              padding: "20px",
              borderRadius: "8px",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
              width: "85%",
              maxWidth: "900px",
              height: "85%",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Close Button */}
            <button
              onClick={closeModal}
              style={{
                position: "absolute",
                top: "10px",
                right: "10px",
                background: "red",
                color: "#fff",
                border: "none",
                borderRadius: "50%",
                width: "30px",
                height: "30px",
                cursor: "pointer",
              }}
            >
              &times;
            </button>

            {/* Unity Canvas */}
            <canvas id="unity-canvas" style={{ flex: 1, border: "1px solid #ccc" }}></canvas>

            {/* Progress Bar */}
            <div
              id="progress-bar"
              style={{
                backgroundColor: "blue",
                height: "5px",
                width: "0%",
                marginTop: "10px",
              }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EndlessRunner;
