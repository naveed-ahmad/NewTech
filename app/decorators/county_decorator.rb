class CountyDecorator < Draper::Base
  decorates :county

  def companies_numbers
    results = filter_companies_by_search_params(companies)
    results.count
  end

  def companies_percentage
    # The base is always the total count of offices
    ((companies_numbers * 100).to_f / Company.count).to_f
  end

  def companies_by_category
    Category.group_name_with_companies(filter_companies_by_search_params(companies))
  end

  def companies_avg_latitude
    filtered_companies = filter_companies_by_search_params(companies)
    filtered_companies.average(:latitude)
  end

  def companies_avg_longitude
    filtered_companies = filter_companies_by_search_params(companies)
    filtered_companies.average(:longitude)
  end

  private

  def filter_companies_by_search_params(companies)
    results = companies.scoped
    unless search_params.nil?
      results = results.name_like search_params[:company_name] unless search_params[:company_name].nil? || search_params[:company_name].empty?
      results = results.founded_from search_params[:from_year] unless search_params[:from_year].nil? || search_params[:from_year].empty?
      results = results.founded_to search_params[:to_year] unless search_params[:to_year].nil? || search_params[:to_year].empty?
      results = results.tagged_as search_params[:tag_code] unless search_params[:tag_code].nil? || search_params[:tag_code].empty?
      results = results.are_hiring unless search_params[:hiring].nil? || search_params[:hiring].empty?
      results = results.employee_type(search_params[:employee_id]) unless search_params[:employee_id].nil? || search_params[:employee_id].empty?
      results = results.investment_type(search_params[:investment_id]) unless search_params[:investment_id].nil? || search_params[:investment_id].empty?
      results = results.with_category(search_params[:category_id]) unless search_params[:category_id].nil? || search_params[:category_id].empty?
    end
    results.uniq
  end

  def search_params
    @options[:search_params] ||= nil
  end

end
