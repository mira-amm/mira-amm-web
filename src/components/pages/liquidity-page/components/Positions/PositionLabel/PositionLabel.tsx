import styles from './PositionLabel.module.css';

type Props = {
  status?: 'active' | 'inactive';
}

const PositionLabel = ({ status }: Props) => {
  return (
    <p className={styles.positionLabel}>
      Active
    </p>
  );
};

export default PositionLabel;
