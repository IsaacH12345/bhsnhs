
import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/Button';

interface ContentPageProps {
  pageTitle: string;
}

const ContentPage: React.FC<ContentPageProps> = ({ pageTitle }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-[#1E1B2E] text-white">
      <div className="bg-[#2A2640] p-10 rounded-xl shadow-2xl text-center max-w-2xl w-full">
        <h1 className="text-4xl font-bold mb-8">{pageTitle}</h1>
        <p className="text-lg text-gray-300 mb-8">
          This is the placeholder page for "{pageTitle}".
          Content for this section will be added here. You can manage and update this
          page's information through the admin panel once implemented.
        </p>
        <div className="space-y-4">
            <img src={`https://picsum.photos/seed/${pageTitle}/600/300`} alt={`${pageTitle} placeholder`} className="rounded-lg mx-auto shadow-lg"/>
            <p className="text-gray-400 text-sm">
                Explore more about our activities and initiatives related to {pageTitle.toLowerCase()}. 
                We are committed to making a difference.
            </p>
        </div>
        <div className="mt-10">
          <Button to="/">
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ContentPage;
    