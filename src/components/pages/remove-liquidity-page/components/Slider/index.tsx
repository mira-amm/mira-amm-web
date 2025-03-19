import React from "react";
import styles from "./index.module.css";

const Slider = ({
  value,
  onChange,
}: {
  value: number;
  onChange: (val: number) => void;
}) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(Number(event.target.value));
  };

  return (
    <div className={styles.sliderContainer}>
      <div className={styles.sliderWrapper}>
        <input
          type="range"
          min="0"
          max="100"
          step="25"
          value={value}
          onChange={handleChange}
          className={styles.customSlider}
        />
        <div className={styles.sliderDots}>
          <div className={styles.dot} style={{left: "0%"}}></div>
          <div className={styles.dot} style={{left: "25%"}}></div>
          <div className={styles.dot} style={{left: "50%"}}></div>
          <div className={styles.dot} style={{left: "75%"}}></div>
          <div className={styles.dot} style={{left: "100%"}}></div>
        </div>
        <div className={styles.sliderLabels}>
          <span>0%</span>
          <span>25%</span>
          <span>50%</span>
          <span>75%</span>
          <span>100%</span>
        </div>
      </div>
    </div>
  );
};

export default Slider;
