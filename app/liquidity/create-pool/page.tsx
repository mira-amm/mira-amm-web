import CreatePoolPageLayout from "@/src/components/pages/create-pool-page/CreatePoolPageLayout";
import {Suspense} from "react";

const CreatePoolPage = () => {
    return (
      <Suspense>
        <CreatePoolPageLayout />
      </Suspense>
    );
  };
  
  export default CreatePoolPage;