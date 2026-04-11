import { useEffect, useRef, useState } from "react";
import "./area-frame-video.css";

export default function AreaFrameVideo({ videos = [] }) {
    const [positions, setPositions] = useState([]);
    const [activeIndex, setActiveIndex] = useState(0);
    const [isVideoReady, setIsVideoReady] = useState(false);

    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const objectUrlRef = useRef(null);

    useEffect(() => {
        setPositions(videos.map(() => 0));
        setActiveIndex(0);
        setIsVideoReady(false);
    }, [videos]);

    const activeVideo = videos[activeIndex];
    const activePosition = positions[activeIndex] ?? 0;

    function handleChange(index, value) {
        const numericValue = Number(value);

        setPositions((prev) => {
            const updated = [...prev];
            updated[index] = numericValue;
            return updated;
        });

        setActiveIndex(index);
    }

    function drawFrame() {
        const video = videoRef.current;
        const canvas = canvasRef.current;

        if (!video || !canvas || video.videoWidth === 0 || video.videoHeight === 0) {
            return;
        }

        const ctx = canvas.getContext("2d");

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    }

    function seekToCurrentPosition() {
        const video = videoRef.current;

        if (!video || !video.duration) return;

        const targetTime = (activePosition / 100) * video.duration;
        video.currentTime = targetTime;
    }

    useEffect(() => {
        const video = videoRef.current;
        if (!video || !activeVideo) return;

        setIsVideoReady(false);

        if (objectUrlRef.current) {
            URL.revokeObjectURL(objectUrlRef.current);
        }

        const objectUrl = URL.createObjectURL(activeVideo);
        objectUrlRef.current = objectUrl;

        video.src = objectUrl;
        video.load();
    }, [activeVideo]);

    useEffect(() => {
        return () => {
            if (objectUrlRef.current) {
                URL.revokeObjectURL(objectUrlRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (!isVideoReady) return;
        seekToCurrentPosition();
    }, [activePosition, activeIndex, isVideoReady]);

    return (
        <div className="preview-container">
            <div className="preview-box">
                {activeVideo ? (
                    <div className="preview-content">
                        <p><strong>{activeVideo.name}</strong></p>

                        <video
                            ref={videoRef}
                            className="hidden-video"
                            muted
                            playsInline
                            preload="auto"
                            onLoadedMetadata={() => {
                                setIsVideoReady(true);
                            }}
                            onSeeked={drawFrame}
                        />

                        <canvas
                            ref={canvasRef}
                            className="preview-canvas"
                        />
                    </div>
                ) : (
                    <p>No video selected</p>
                )}
            </div>

            <div className="sliders">
                {videos.map((video, index) => (
                    <div key={index} className="slider-item">
                        <span>{video.name}</span>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={positions[index] ?? 0}
                            onChange={(e) => handleChange(index, e.target.value)}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}