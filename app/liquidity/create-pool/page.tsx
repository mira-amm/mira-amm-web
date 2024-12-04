import {Suspense} from "react";

import CreatePoolPageLayout from "@/src/components/pages/create-pool-page/CreatePoolPageLayout";

const CreatePoolPage = () => {
  return (
    <Suspense>
      <CreatePoolPageLayout />
    </Suspense>
  );
};

export default CreatePoolPage;
