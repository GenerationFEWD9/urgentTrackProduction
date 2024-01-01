import React, { useEffect, useState } from "react";
import styles from "../App.module.css";
import SearchBar from "./SearchBar";
import LastUploadTime from "./LastUploadTime";
import Map from "./Map";
import { isWaitTimeOverTwoHours } from "./utils";
import CallIcon from "@mui/icons-material/Call";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import NavigationIcon from "@mui/icons-material/Navigation";
import HourglassBottomIcon from "@mui/icons-material/HourglassBottom";
import QueryBuilderIcon from "@mui/icons-material/QueryBuilder";
import InfoIcon from "@mui/icons-material/Info";
import { hospitalSpecialistServices } from "./utils";
import { districtColor } from "./utils";

function Distance({ userLocation, setUserLocation }) {
  //For enabling CORS
  // https://cors-anywhere.herokuapp.com/corsdemo

  //CORS proxy
  const CORS = "https://cors-anywhere.herokuapp.com/";

  //A&E waiting time
  const API1 = `${CORS}https://www.ha.org.hk/opendata/aed/aedwtdata-tc.json`;

  //Hospital address,website,contact
  const API2 = `${CORS}https://api.csdi.gov.hk/apim/dataquery/api/?id=fhb_rcd_1637028364270_14638&layer=geotagging&limit=200&offset=0`;

  //Distance and Hospital Name API
  const hospitalUrl = `${CORS}https://www.ha.org.hk/opendata/facility-hosp.json`;

  //For Distance API use
  const [hospitals, setHospitals] = useState([]);
  const [distances, setDistances] = useState([]);

  //For Hospital Tel API use
  const [isFetching2, setIsFetching2] = useState(false);
  const [hospitalsData, setHospitalsData] = useState([]);

  //For WaitTime API use
  const [isFetching, setIsFetching] = useState(false);
  const [latestTime, setLatestTime] = useState("");
  const [characters, setCharacters] = useState([]); // array

  //For the search bar use
  const [searchTerm, setSearchTerm] = useState("");

  //For Map use
  // const [userLocation, setUserLocation] = useState(null);
  const [selectedHospitalLocation, setSelectedHospitalLocation] =
    useState(null);

  // Function to update the selected hospitaﬁl location
  const handleHospitalSelect = (location) => {
    setSelectedHospitalLocation(location);
  };

  // Function to filter hospitals based on search term
  const getFilteredDistances = () => {
    if (!searchTerm) {
      return distances;
    }
    return distances.filter((item) =>
      item.hospital.institution_tc.includes(searchTerm)
    );
  };

  //WaitTime API Fetching
  useEffect(() => {
    const getData = async () => {
      try {
        setIsFetching(true);
        const res = await fetch(API1);
        const { waitTime, updateTime } = await res.json();
        setCharacters(waitTime);
        setLatestTime(updateTime);
      } catch (err) {
        console.log(err);
      } finally {
        setIsFetching(false);
      }
    };
    getData();
  }, []);

  // On Click function for hospital container
  const handleHospitalClick = (hospital) => {
    // Call the onHospitalSelect function provided by the parent component

    handleHospitalSelect({
      latitude: hospital.latitude,
      longitude: hospital.longitude,
      hospitalName: hospital.institution_tc,
    });

    const scrollToPosition = () => {
      window.scrollTo({
        top: 100, // Scroll to the top of the page
        behavior: "smooth", // Add smooth scrolling behavior
      });
    };
    scrollToPosition();
  };

  //Hospital Tel API fetching
  useEffect(() => {
    const getData2 = async () => {
      try {
        setIsFetching2(true);
        const res = await fetch(API2);
        const data = await res.json();

        // Create an array to hold all hospital names and contact numbers
        const hospitalsData = data.features.map((feature) => {
          const properties = feature.properties;
          // Replace <br/> with space or any other preferred separator
          const contact = properties.NSEARCH02_TC.replace("<br/>", " / ");
          return {
            name: properties.NAME_TC,
            contact: contact,
            website: properties.NSEARCH03_TC,
            address: properties.ADDRESS_TC,
            latitude: properties.LATITUDE,
            longitude: properties.LONGITUDE,
          };
        });
        setHospitalsData(hospitalsData);
      } catch (err) {
        console.log(err);
      } finally {
        setIsFetching2(false);
      }
    };
    getData2();
  }, []);

  console.log(hospitalsData);

  //Distance API Fetching
  useEffect(() => {
    fetchUserLocation();
  }, []);

  useEffect(() => {
    if (userLocation) {
      fetchHospitalData();
    }
  }, [userLocation]);

  useEffect(() => {
    if (hospitals.length > 0 && userLocation) {
      calculateDistances(hospitals);
    }
  }, [hospitals, userLocation]);

  const fetchUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLatitude = position.coords.latitude;
          const userLongitude = position.coords.longitude;
          setUserLocation({
            latitude: userLatitude,
            longitude: userLongitude,
          });
        },
        (error) => {
          console.log(error);
        }
      );
    } else {
      console.log("Geolocation is not supported by this browser.");
    }
  };

  const fetchHospitalData = async () => {
    try {
      const response = await fetch(hospitalUrl);
      const data = await response.json();
      const filteredHospitals = data.filter(
        (hospital) => hospital.with_AE_service_eng === "Yes"
      );
      setHospitals(filteredHospitals);
      calculateDistances(filteredHospitals);
    } catch (error) {
      console.log(error);
    }
  };

  const calculateDistances = (hospitals) => {
    if (userLocation) {
      const distances = hospitals.map((hospital) => {
        const lat1 = parseFloat(hospital.latitude);
        const lon1 = parseFloat(hospital.longitude);
        const lat2 = userLocation.latitude;
        const lon2 = userLocation.longitude;
        const R = 6371; // Radius of the Earth in kilometers
        const dLat = deg2rad(lat2 - lat1);
        const dLon = deg2rad(lon2 - lon1);
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(deg2rad(lat1)) *
            Math.cos(deg2rad(lat2)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c; // Distance in kilometers
        return { hospital, distance };
      });
      //Sort distances in ascending order
      distances.sort((a, b) => a.distance - b.distance);
      setDistances(distances);
    }
  };

  const deg2rad = (deg) => {
    return deg * (Math.PI / 180);
  };

  function districtColor2(district) {
    if (district === "港島") {
      return styles.hkisland;
    }
    if (district === "九龍") {
      return styles.kowloon;
    }
    if (district === "新界") {
      return styles.newterr;
    }
    return ""; // Return an empty string or some default class if district doesn't match
  }

  console.log(hospitals);
  console.log(distances);

  return (
    <div className={styles["main-container"]}>
      <h1>急症室等候時間</h1>
      <div id="hospitalDisplayWrapper">
        <SearchBar onSearch={setSearchTerm} />
        <div className="MapWithDistanceWrapper">
          <Map
            userLocation={userLocation}
            location={selectedHospitalLocation}
          />
        </div>
        {distances.length > 0 ? (
          <div>
            <div className={styles["hospital-container"]}>
              <p>
                <LocalHospitalIcon sx={{ fontSize: 16 }} />
                以下是距離您當前位置最近的急症室服務：
              </p>
              {getFilteredDistances().map((item, index) => (
                <div
                  key={index}
                  className={styles["hospital-item"]}
                  onClick={() => handleHospitalClick(item.hospital)}
                >
                  <div
                    className={districtColor2(
                      hospitalSpecialistServices.find(
                        (obj) => obj.name === item.hospital.institution_tc
                      )?.district
                    )}
                  >
                    <p>
                      {
                        // Use find to locate the matching service and return its district
                        hospitalSpecialistServices.find(
                          (obj) => obj.name === item.hospital.institution_tc
                        )?.district
                      }
                    </p>
                  </div>
                  <h2>
                    {item.hospital.institution_tc}
                    <span>
                      &emsp;<span class="glyphicon glyphicon-map-marker"></span>
                      {item.distance.toFixed(0)} km
                    </span>
                  </h2>
                  {isFetching ? (
                    <p>
                      <HourglassBottomIcon />
                      等候時間更新中...
                    </p>
                  ) : (
                    characters
                      .filter(
                        (char) => char.hospName === item.hospital.institution_tc
                      )
                      .map(({ hospName, topWait }) => (
                        <div key={hospName} className="wait-Time">
                          <p>
                            等候時間：
                            <span
                              className={
                                isWaitTimeOverTwoHours(topWait)
                                  ? styles.redText
                                  : styles.blueText
                              }
                            >
                              {topWait}
                            </span>
                          </p>
                        </div>
                      ))
                  )}

                  {isFetching2 ? (
                    <p>
                      <HourglassBottomIcon />
                      詳細資訊更新中...
                    </p>
                  ) : (
                    hospitalsData
                      .filter(
                        (hospitalsData) =>
                          hospitalsData.name === item.hospital.institution_tc
                      )
                      .map(({ name, contact, website, address }) => (
                        <div key={name}>
                          <p>
                            <NavigationIcon style={{ color: "#2683fd" }} />
                            <a>&emsp;{address}</a>
                          </p>
                          <p>
                            <CallIcon style={{ color: "#2683fd" }} />

                            <a href={`tel:${contact}`}>&emsp; {contact}</a>
                          </p>
                          <p>
                            <InfoIcon style={{ color: "#2683fd" }} />
                            <a
                              href={website}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              &emsp;查看更多
                            </a>
                          </p>
                        </div>
                      ))
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p>
            <HourglassBottomIcon />
            醫院距離更新中...
          </p>
        )}
        <footer>
          <LastUploadTime latestTime={latestTime} />
        </footer>
      </div>
    </div>
  );
}

export default Distance;
