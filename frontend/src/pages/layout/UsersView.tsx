// ========== UsersView.tsx (FIXED) ==========
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { UsersList } from "@/components/users/UsersLists";
import UserInfoPage from "@/pages/layout/UserInfoPage.tsx";
import { useParams } from "react-router-dom";
import { Users } from "lucide-react";

const UsersView = () => {
  const { userId } = useParams();

  return (
    <ResizablePanelGroup direction="horizontal" className="w-full h-full">
      {/* Users List */}
      <ResizablePanel
        defaultSize={30}
        minSize={25}
        maxSize={40}
        className="border-r"
      >
        <UsersList selectedUserId={userId} />
      </ResizablePanel>

      <ResizableHandle withHandle />

      {/* User Info */}
      <ResizablePanel defaultSize={70}>
        {userId ? (
          <UserInfoPage userId={userId} />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-muted-foreground">
              <Users className="w-24 h-24 mx-auto mb-4 opacity-20" />
              <h3 className="text-lg font-semibold">Select a user</h3>
              <p className="text-sm">Choose a user to view their profile</p>
            </div>
          </div>
        )}
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};

export default UsersView;
