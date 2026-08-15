"use client";

import { useEffect, useRef, useState } from "react";

type RevealProps = {
    children: React.ReactNode;
    className?: string;
    delay?: number;
};

export function Reveal({ children, className = "", delay = 0 }: RevealProps) {
    const ref = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            const frame = window.requestAnimationFrame(() => setVisible(true));
            return () => window.cancelAnimationFrame(frame);
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setVisible(true);
                    observer.disconnect();
                }
            },
            { rootMargin: "0px 0px -8%", threshold: 0.1 },
        );

        observer.observe(element);
        return () => observer.disconnect();
    }, []);

    return (
        <div
            ref={ref}
            className={`${className} transition-[opacity,transform] duration-700 ease-out motion-reduce:transition-none ${
                visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
            }`}
            style={{ transitionDelay: visible ? `${delay}ms` : "0ms" }}
        >
            {children}
        </div>
    );
}
