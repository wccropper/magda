import React, { FunctionComponent, useState, useEffect } from "react";
import { Link, Route, Switch, Redirect, withRouter } from "react-router-dom";
import Breadcrumbs from "Components/Common/Breadcrumbs";
import defined from "helpers/defined";
import DatasetPageDetails from "./View/DatasetPageDetails";
import DatasetPageSuggestForm from "./View/DatasetPageSuggestForm";
import { Small, Medium } from "Components/Common/Responsive";
import DescriptionBox from "Components/Common/DescriptionBox";
import "./DatasetPage.scss";
import TagsBox from "Components/Common/TagsBox";
import ContactPoint from "Components/Common/ContactPoint";
import QualityIndicator from "Components/Common/QualityIndicator";
import { History } from "history";
import { ParsedDataset } from "helpers/record";
import queryString from "query-string";
import ToolTip from "Components/Common/TooltipWrapper";
import SecClassification, {
    Sensitivity
} from "Components/Common/SecClassification";

interface PropsType {
    history: History;
    datasetId: string;
    dataset: ParsedDataset;
    hasEditPermissions: boolean;
    breadcrumbs: JSX.Element | null;
    searchText: string;
}

const DatasetPage: FunctionComponent<PropsType> = (props) => {
    const [addMargin, setAddMargin] = useState<boolean>(false);

    const { dataset, breadcrumbs, hasEditPermissions } = props;

    const baseUrlDataset = `/dataset/${encodeURI(props.datasetId)}`;

    const publisherId = dataset?.publisher?.id ? dataset.publisher.id : null;

    const editButtonTooltipText =
        "This dataset is harvested from outside the system, so it can't be edited here.";

    const isDatasetEditable =
        dataset?.sourceDetails?.id === "magda" &&
        dataset?.sourceDetails?.type === "internal";

    const renderResult = (
        <div
            itemScope
            itemType="http://schema.org/Dataset"
            className="record--dataset"
        >
            <Medium>
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </Medium>
            {dataset.publishingState === "draft" ? (
                <div className="au-page-alerts au-page-alerts--info">
                    <h3>Draft Dataset</h3>
                    <p>
                        This dataset is a draft and has not been published yet.
                        Once the dataset is approved, it will appear in your
                        catalogue.
                    </p>
                </div>
            ) : null}
            <div className="row">
                <div className="col-sm-8">
                    <h1 itemProp="name">{dataset?.title}</h1>
                    <div className="publisher-basic-info-row">
                        <span
                            itemProp="publisher"
                            className="publisher"
                            itemScope
                            itemType="http://schema.org/Organization"
                        >
                            <Link
                                to={`/organisations/${publisherId}`}
                                itemProp="url"
                            >
                                <span itemProp="name">
                                    {dataset.publisher.name}
                                </span>
                            </Link>
                        </span>

                        {defined(dataset.issuedDate) && (
                            <span className="created-date hidden-sm">
                                <span className="separator hidden-sm"> / </span>
                                Created{" "}
                                <span itemProp="dateCreated">
                                    {dataset.issuedDate}
                                </span>
                                &nbsp;
                            </span>
                        )}

                        {defined(dataset.updatedDate) && (
                            <span className="updated-date hidden-sm">
                                <span className="separator hidden-sm">
                                    &nbsp;/&nbsp;
                                </span>
                                Updated{" "}
                                <span itemProp="dateModified">
                                    {dataset.updatedDate}
                                </span>
                            </span>
                        )}
                        <div className="dataset-details-overview">
                            <Small>
                                <DescriptionBox
                                    content={dataset.description}
                                    truncateLength={200}
                                />
                            </Small>
                            <Medium>
                                <DescriptionBox
                                    content={dataset.description}
                                    truncateLength={500}
                                />
                            </Medium>
                        </div>
                        {dataset.hasQuality ? (
                            <div className="quality-rating-box">
                                <QualityIndicator
                                    quality={dataset.linkedDataRating}
                                />
                            </div>
                        ) : null}
                        {dataset.informationSecurity?.classification && (
                            <SecClassification
                                secClass={
                                    dataset.informationSecurity.classification
                                }
                            />
                        )}
                        {dataset.informationSecurity?.disseminationLimits && (
                            <Sensitivity
                                sensitivityList={
                                    dataset.informationSecurity
                                        .disseminationLimits
                                }
                            />
                        )}
                        {dataset.contactPoint ? (
                            <ContactPoint contactPoint={dataset.contactPoint} />
                        ) : (
                            <></>
                        )}
                        {dataset.currencyStatus ? (
                            <div>
                                Currency of the dataset:{" "}
                                {dataset.currencyStatus}
                            </div>
                        ) : null}
                        {dataset.accrualPeriodicity ? (
                            <div>Updated: {dataset.accrualPeriodicity}</div>
                        ) : null}
                        <TagsBox content={dataset.tags} title="Tags" />
                        <TagsBox content={dataset.themes} title="Themes" />
                        {defined(dataset.access?.location) && (
                            <div>
                                <div className="dataset-heading">
                                    File Location (outside Magda):
                                </div>
                                <div>{dataset.access.location}</div>
                            </div>
                        )}
                    </div>
                </div>
                <div className={` col-sm-4 ${addMargin ? "form-margin" : ""}`}>
                    <DatasetPageSuggestForm
                        title={dataset.title}
                        toggleMargin={setAddMargin}
                        datasetId={dataset.identifier}
                    />
                    {hasEditPermissions ? (
                        <div className="dataset-edit-button-container no-print">
                            <button
                                className="au-btn au-btn--secondary ask-question-button"
                                disabled={!isDatasetEditable}
                                onClick={() => {
                                    props.history.push({
                                        pathname: `/dataset/edit/${dataset.identifier}`
                                    });
                                }}
                            >
                                Edit the Dataset{" "}
                            </button>
                            {isDatasetEditable ? null : (
                                <div className="edit-button-tooltip-container">
                                    <ToolTip
                                        className="no-print"
                                        launcher={(launch) => (
                                            <a
                                                onClick={launch}
                                                className="tooltip-launcher-text"
                                            >
                                                Why can't I edit this?
                                            </a>
                                        )}
                                        innerElementClassName="inner"
                                        orientation="below"
                                    >
                                        {() => editButtonTooltipText}
                                    </ToolTip>
                                </div>
                            )}
                        </div>
                    ) : null}
                </div>
            </div>
            <div className="tab-content">
                <Switch>
                    <Route
                        path="/dataset/:datasetId/details"
                        component={DatasetPageDetails}
                    />
                    <Redirect
                        exact
                        from="/dataset/:datasetId"
                        to={{
                            pathname: `${baseUrlDataset}/details`,
                            search: `?q=${props.searchText}`
                        }}
                    />
                    <Redirect
                        exact
                        from="/dataset/:datasetId/resource/*"
                        to={{
                            pathname: `${baseUrlDataset}/details`,
                            search: `?q=${props.searchText}`
                        }}
                    />
                </Switch>
            </div>
        </div>
    );

    useEffect(() => {
        const params = queryString.parse(props.history.location.search);
        if (params.print === "true") {
            window.print();
        }
    }, [props.history.location.search]);

    return renderResult;
};

export default withRouter(DatasetPage);
