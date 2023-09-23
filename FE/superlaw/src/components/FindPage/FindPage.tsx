import "./FindPage.scss";
import Select, { ActionMeta } from "react-select";
import { FormEvent, useEffect, useState } from "react";
import legalCategoriesService from "../../services/legalCategoriesService";
import judicialRegionsService from "../../services/judicialRegionsService";
import { Button } from "react-bootstrap";
import noProfilePic from "../../assets/no-profile-picture-256.png";
import profileService from "../../services/profileService";
import LawyerProfile from "../../models/LawyerProfile";

const FindPage = () => {
  const [allCategories, setCategories] = useState([]);
  const [allRegions, setRegions] = useState([]);

  const [searchForm, setSearchForm] = useState({
    name: "",
    categories: [],
    regions: [],
  });

  const [profiles, setProfiles] = useState<LawyerProfile[]>([]);

  const onCategorySelect = (
    newValue: any,
    actionMeta: ActionMeta<never>
  ): void => {
    setSearchForm({ ...searchForm, categories: newValue });
  };

  const onRegionSelect = (
    newValue: any,
    actionMeta: ActionMeta<never>
  ): void => {
    setSearchForm({ ...searchForm, regions: newValue });
  };

  useEffect(() => {
    const fetchCategories = async () => {
      const res = await legalCategoriesService.getCategories();

      let categoriesRes: any = [];

      res.forEach((x) => {
        categoriesRes.push({
          value: x.id,
          label: x.name,
        });
      });

      setCategories(categoriesRes);
    };

    const fetchRegions = async () => {
      const res = await judicialRegionsService.getRegions();

      let regionsRes: any = [];

      res.forEach((x) => {
        regionsRes.push({
          value: x.id,
          label: x.name,
        });
      });

      setRegions(regionsRes);
    };

    const fetchProfiles = async () => {
      const res = await profileService.getAll(null, [], []);

      setProfiles(res);
    };

    fetchCategories();
    fetchRegions();
    fetchProfiles();
  }, []);

  const onInput = (e: any) => {
    const inputName = e.target.name;
    const value = e.target.value;

    setSearchForm({
      ...searchForm,
      [inputName]: value,
    });
  };

  const onSearchSubmit = async (event: FormEvent) => {
    event.preventDefault();

    const categories = searchForm.categories.map((c: any) => c.value);
    const regions = searchForm.regions.map((r: any) => r.value);
    console.log(searchForm);
    const res = await profileService.getAll(searchForm.name, categories, regions);

    setProfiles(res);
  }

  const orderByNameAsc = () => {
    setProfiles(profiles.slice().sort((a: any, b: any) => {
        if (a.fullName < b.fullName)
            return -1;
        if (a.fullName > b.fullName)
            return 1;
        return 0;
    }));
  };

  const orderByNameDesc = () => {
    setProfiles(profiles.slice().sort((a: any, b: any) => {
        if (a.fullName < b.fullName)
            return 1; 
        if (a.fullName > b.fullName)
            return -1;
        return 0;
    }));
  };

  const orderByHourlyRateAsc = () => {
    setProfiles(profiles.slice().sort((a: any, b: any) => {
        if (a.hourlyRate < b.hourlyRate)
            return -1;
        if (a.hourlyRate > b.hourlyRate)
            return 1;
        return 0;
    }));
  };

  const orderByHourlyRateDesc = () => {
    setProfiles(profiles.slice().sort((a: any, b: any) => {
        if (a.hourlyRate < b.hourlyRate)
            return 1; 
        if (a.hourlyRate > b.hourlyRate)
            return -1;
        return 0;
    }));
  };

  return (
    <div className="find-page-wrapper">
      <form className="search" onSubmit={onSearchSubmit}>
        <h3>Намерете адвокат и резервирайте консултация онлайн</h3>
        <div className="form-group search-bar">
          <input type="text" placeholder="Търси по име..." name='name' onChange={(e) => onInput(e)}/>
        </div>

        <div className="form-group selection">
          <label htmlFor="legalCategory">Категории</label>
          <Select
            isMulti
            name="legalCategories"
            options={allCategories}
            className="basic-multi-select"
            classNamePrefix="select"
            value={searchForm.categories}
            onChange={onCategorySelect}
          />
        </div>

        <div className="form-group selection">
          <label htmlFor="legalCategory">Градове</label>
          <Select
            isMulti
            name="regions"
            options={allRegions}
            className="basic-multi-select"
            classNamePrefix="select"
            value={searchForm.regions}
            onChange={onRegionSelect}
          />
        </div>

        <Button className="search-btn" type="submit" variant="primary">
          Търси
        </Button>
      </form>
      <div className="profiles-section">
        <h2>Профили</h2>
        <div className="sort">
          <span>Подреди по: </span>
          <span className="sorter" onClick={orderByNameAsc}>Име ↑</span>
          <span className="sorter" onClick={orderByNameDesc}>Име ↓</span>
          <span className="sorter" onClick={orderByHourlyRateAsc}>Ставка ↑</span>
          <span className="sorter" onClick={orderByHourlyRateDesc}>Ставка ↓</span>
        </div>
        <div className="profiles">
          {profiles.length === 0 && <p className="no-profiles-msg">Съжаляваме, но не намираме адвокати</p>}
          {profiles.map((profile: any) => (
            <div key={profile.id} className="profile">
              <div className="profile-image">
                <img
                  src={profile.imgPath !== "" ? profile.imgPath : noProfilePic}
                  alt="profile picture"
                />
              </div>
              <div className="important-info">
                <div className="sect">
                  <h3>{profile.fullName}</h3>
                  <p>{profile.isJunior ? "Младши адвокат" : "Адвокат"}</p>
                </div>

                <div className="sect categories">
                  <p className="bold">Категории: </p>
                  {profile.categories.map((cat: any, ind: any) => (
                    <span key={cat.id}>
                      {ind !== profile.categories.length - 1
                        ? cat.name + ", "
                        : cat.name}
                    </span>
                  ))}
                </div>

                <div className="sect regions">
                  <p className="bold">Райони: </p>
                  {profile.regions.map((reg: any, ind: any) => (
                    <span key={reg.id}>
                      {ind !== profile.regions.length - 1
                        ? reg.name + ", "
                        : reg.name}
                    </span>
                  ))}
                </div>
                <div className="sect">
                  <p className="bold">Часова ставка: {profile.hourlyRate}лв</p>
                </div>
                <Button className="primary-btn">Запази час</Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FindPage;
