import pfp1 from '../assets/pfp1.jpg';

export const navLinks = [
  {
      id: "forum",
      title: "Forum",
      path: "/forum"
  },
  {
      id: "mini-games",
      title: "Mini Games",
      path: "/mini-games"
  },
  {
    id: "chat",
    title: "Chat",
    path: "/chat"
  }
];


const userActivities = [
    { description: "Completed a meditation session", time: "2 hours ago" },
    { description: "Shared a post about mental health tips", time: "5 hours ago" },
  ];

  // Dummy data for public profile
  const publicProfileData = {
    name: "Gurmehr Singh Gulati",
    university: "UPES, Dehradun",
    bio: "Passionate about balancing academic life with mental and physical wellness.",
    posts: 54,
    followers: 128,
    following: 76,
    activities: userActivities,
  };

  // Dummy data for private profile
  const privateProfileData = {
    name: "Gurmehr Singh Gulati",
    university: "UPES, Dehradun",
    photo: pfp1, // Replace with the actual photo URL
    height: 170, // in cm
    weight: 65,  // in kg
    mood: "Happy",
    habits: ["Drinking water", "Meditating", "Exercising"],
    suggestions: [
      "Go for a run",
      "Write in a diary",
      "Read a book",
      "Practice yoga",
    ],
  };

export {userActivities, publicProfileData, privateProfileData};