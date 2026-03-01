import React from 'react';

interface LogoProps {
    className?: string; // e.g. w-6 h-6
}

export function Logo({ className = "w-6 h-6" }: LogoProps) {
    return (
        <div className={`relative flex items-center justify-center ${className}`}>
            <svg
                viewBox="0 0 32 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full text-white"
            >
                {/* AI Spark / Star */}
                <path
                    d="M16 2C16 5.5 18.5 8 22 8C18.5 8 16 10.5 16 14C16 10.5 13.5 8 10 8C13.5 8 16 5.5 16 2Z"
                    fill="currentColor"
                />

                {/* Book Left Page */}
                <path
                    d="M16 28C16 28 12 24 4 24V12C12 12 16 16 16 16"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                {/* Book Right Page */}
                <path
                    d="M16 28C16 28 20 24 28 24V12C20 12 16 16 16 16"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                {/* Book Spine */}
                <path
                    d="M16 28V16"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        </div>
    );
}
