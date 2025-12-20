import { Footer } from "@/components/footer"
import Header from "@/components/header"
import AuthHandler from "@/handlers/auth-handler"
import { FloatingMentorChatbot } from "@/components/floating-mentor-chatbot"

import { Outlet } from "react-router-dom"

export const PublicLayout = () => {
    return (
        <div className="w-full">
            {/* Handler to store user data */}
            <AuthHandler />

            <Header />
            <Outlet />
            <Footer />
            
            {/* Floating chatbot available on all public pages */}
            <FloatingMentorChatbot />
        </div>
    )
}