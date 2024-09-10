import ViewPositionPageLayout from "@/src/components/pages/view-position-page/ViewPositionPageLayout";
import {Suspense} from "react";

const ViewPositionPage = () => {
  return (
    <Suspense>
      <ViewPositionPageLayout />
    </Suspense>
  );
};

export default ViewPositionPage;
