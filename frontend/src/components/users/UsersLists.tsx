import { useAppDispatch, useAppSelector } from "@/redux/hooks.ts";
import { fetchAllUsers } from "@/features/user/userThunks.ts";
import { useEffect } from "react";
import Loader from "@/components/common/Loader.tsx";

export const UsersList = () => {
  const dispatch = useAppDispatch();
  const { allUsers, status } = useAppSelector((state) => state.user);
  console.log("====================================");
  console.log({ allUsers });
  console.log("====================================");
  useEffect(() => {
    const getUserData = async () => {
      const response = await dispatch(fetchAllUsers()).unwrap();
      console.log("====================================");
      console.log({ response });
      console.log("====================================");
    };
    getUserData();
  }, [dispatch]);

  if (status === "loading") return <Loader />;
  console.log("====================================");
  console.log({ allUsers });
  console.log("====================================");
  return (
    <ul>
      {allUsers && allUsers.length > 0 ? (
        allUsers.map((user) => (
          <li key={user._id}>
            {user.username}:{user.email}
          </li>
        ))
      ) : (
        <li>No users found</li>
      )}
    </ul>
  );
};
