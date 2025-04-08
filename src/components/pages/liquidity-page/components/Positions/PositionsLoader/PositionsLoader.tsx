import styles from "./PositionsLoader.module.css";
import clsx from "clsx";
import desktopPositionStyles from "../../Positions/MobilePositions/DesktopPositions/DesktopPositions.module.css";

const PositionsLoader = ({ count = 3 }: { count: number }): JSX.Element => {

    return (
        <table className={clsx(desktopPositionStyles.desktopPositions, "desktopOnly")}>
            <thead>
                <tr>
                    <th><div className={`skeleton-line line-3 ${styles.tableHeadingText}`} /></th>
                    <th><div className={`skeleton-line line-3 ${styles.tableHeadingText} ${styles.marginAuto}`} /></th>
                    <th><div className={`skeleton-line line-3 ${styles.tableHeadingText} ${styles.marginAuto}`} /></th>
                    <th></th>
                </tr>
            </thead>
            <tbody>
                {
                    Array.from({ length: count }, (_, i) => (
                        <tr key={i}>
                            <td>
                                <div className={`skeleton-item ${styles.tableCell}`}>
                                    <div className="skeleton-avatar" />
                                    <div className="skeleton-avatar" />
                                    <div className={`skeleton-text ${styles.loaderLineCenter}`}>
                                        <div className={`skeleton-line line-3`} />
                                        <div className={`skeleton-line line-3`} />
                                    </div>
                                </div>
                            </td>
                            <td>
                                <div className={`skeleton-text ${styles.loaderLineCenter}`}>
                                    <div className={`skeleton-line line-2 ${styles.loaderLineHeight}`} />
                                </div>
                            </td>
                            <td>
                                <div className={`skeleton-text ${styles.loaderLineCenter}`}>
                                    <div className={`skeleton-line line-3 ${styles.loaderLineHeight}`} />
                                </div>
                            </td>
                            <td>
                                <div style={{ minWidth: "100px" }} className="skeleton-text">
                                    <div className={`skeleton-line line-1 ${styles.loaderLineHeight}`} />
                                </div>
                            </td>
                        </tr>
                    ))
                }
            </tbody>
        </table>
    );
};

export default PositionsLoader;
