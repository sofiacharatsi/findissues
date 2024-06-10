import SeoTags from "@/components/SeoTags";
import styles from "@/styles/ActiveRepo.module.css";
import RepoCard from "@/components/RepoCard";
import { useState, useEffect, useRef } from "react";
import moment from "moment/moment";
import { FaSort } from "react-icons/fa";
import { repos_list } from '@/_data/repos';


export default function ActiveRepo({ repoDetails }) {
    const [activeIndex, setActiveIndex] = useState(-1);
    const [sortOption, setSortOption] = useState("Best Match");
    const [sortedRepos, setSortedRepos] = useState(repoDetails);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);


    const toggleDropdown = () => {
        setIsOpen(!isOpen);
    };


    const closeDropdown = () => {
        setIsOpen(false);
    };


    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                closeDropdown();
            }
        }


        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);


    const sortRepos = (option) => {
        const sortingFunctions = {
            'Best Match': (a, b) => 0,
            'Most Stars': (a, b) => b.stars - a.stars,
            'Least Stars': (a, b) => a.stars - b.stars,
            'Most Forks': (a, b) => b.forks - a.forks,
            'Least Forks': (a, b) => a.forks - b.forks,
        };


        const sorted = [...repoDetails].sort(sortingFunctions[option]);
        setSortedRepos(sorted);
        setSortOption(option);
        closeDropdown();
    };


    const getDayDiff = (updated_at) => {
        let diffDay = Math.abs(
            moment
                .utc(updated_at, "YYYY-MM-DD HH:mm:ss")
                .diff(moment.now(), "milliseconds", true),
        ) / 86400000;


        return diffDay;
    }


    return (
        <>
            <SeoTags
                seoTitle="FindIssues | Active Repos"
                seoDescription="FindIssues lets you find the most recently created issues on GitHub that are not assigned to anyone according to your development language"
                seoUrl="https://www.findissues.me"
            />


            <div className={`${styles.active_repo} p-3 md:p-8 issues_result overflow-auto w-[100%] md:w-[54%] landing_main h-full flex flex-col items-start justify-start`}>
                <div className="w-full flex justify-between items-center mb-4">
                    <p className="font-semibold text-[16px] lg:text-[18px] text-main_primary">
                        <span className="inline-block italic">Active Repos List</span>{" "}
                        👇
                    </p>
                    <div className="relative inline-block text-left" ref={dropdownRef}>
                        <button
                            onClick={toggleDropdown}
                            type="button"
                            className={`flex items-center py-1 px-2 border-2 border-main_primary rounded-[5px] text-[12px] text-main_secondary_low lg:text-[14px] hover:bg-main_secondary`}
                            id="options-menu"
                            aria-haspopup="listbox"
                            aria-expanded="true"
                        >
                            <FaSort className="inline-flex mr-[5px]" /> {sortOption}
                        </button>


                        {isOpen && (
                            <div
                                className="origin-top-right absolute right-0 mt-1 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10 bg-main_secondary"
                                role="menu"
                                aria-orientation="vertical"
                                aria-labelledby="options-menu"
                            >
                                <div className="py-1" role="none">
                                    {['Best Match', 'Most Stars', 'Least Stars', 'Most Forks', 'Least Forks'].map((option) => (
                                        <a
                                            key={option}
                                            onClick={() => sortRepos(option)}
                                            href="#"
                                            className="block px-4 py-2 text-sm text-white hover:bg-gray-700"
                                            role="menuitem"
                                            tabIndex="-1"
                                        >
                                            {option}
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>


                {sortedRepos.map((repo, index) => {
                    if (getDayDiff(repo.updated_at) <= 3) {
                        return <RepoCard key={index} setActiveIndex={setActiveIndex} activeIndex={activeIndex} repo={repo} index={index} />;
                    }
                })}
            </div>
        </>
    )
}


export async function getStaticProps() {
    let repo_result = [];


    repo_result = repos_list.map(async repo_url => {
        const repo_name = repo_url.split("/")[3] + "/" + repo_url.split("/")[4];
        const repo_endpoint = 'https://api.github.com/repos/' + repo_name;


        const response = await fetch(repo_endpoint, {
            headers: {
                Authorization: "token " + process.env.NEXT_PUBLIC_FETCH_REPO,
                Accept: "application/vnd.github.v3+json",
            },
        });
        const result = await response.json();
        const repo_details = {
            full_name: result.full_name,
            updated_at: result.updated_at,
            stars: result.stargazers_count,
            forks: result.forks_count,
            language: result.language,
            open_issues: result.open_issues_count,
            issue_url: repo_endpoint + '/issues'
        }


        return repo_details;
    })


    return {
        props: {
            repoDetails: await Promise.all(repo_result)
        },
        revalidate: 600
    }
}
