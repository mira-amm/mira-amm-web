import React from "react";
import styles from "./index.module.css";
import clsx from "clsx";

const STEPS = ["0%", "25%", "50%", "75%", "100%"];

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

  const getIsSelectedDot = (dot: string) =>
    parseFloat(dot.replace("%", "")) === value;

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
          {STEPS.map((step) => (
            <div
              className={clsx(
                styles.dot,
                getIsSelectedDot(step) && styles.dotsSelected,
              )}
              style={{left: step}}
              key={step}
            ></div>
          ))}
        </div>
        <div className={styles.sliderLabels}>
          {STEPS.map((step) => (
            <span key={step}>{step}</span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Slider;
