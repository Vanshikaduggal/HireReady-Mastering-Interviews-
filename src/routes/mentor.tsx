import { CustomBreadCrumb } from "@/components/custom-bread-crumb";
import { Headings } from "@/components/headings";
import { MentorChatbot } from "@/components/mentor-chatbot";

export const Mentor = () => {
  return (
    <div className="flex flex-col w-full gap-6 py-5">
      <CustomBreadCrumb
        breadCrumbPage="Career Mentor"
        breadCrumpItems={[{ label: "Dashboard", link: "/generate" }]}
      />

      <Headings
        title="AI Career Mentor"
        description="Get personalized guidance on tech stacks, roles, and career paths"
      />

      <MentorChatbot />
    </div>
  );
};
