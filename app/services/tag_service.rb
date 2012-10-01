class TagService

  def self.search(params)
    tags = Tag.scoped


    tags = tags.with_companies_founded_from params[:from_year] unless params[:from_year].nil? || params[:from_year].empty?
    tags = tags.with_companies_founded_to params[:to_year] unless params[:to_year].nil? || params[:to_year].empty?
    tags = tags.with_company_are_hiring unless params[:hiring].nil? || params[:hiring].empty?
    tags = tags.with_company_employee_type(params[:employee_id]) unless params[:employee_id].nil? || params[:employee_id].empty?
    tags = tags.with_company_investment_type(params[:investment_id]) unless params[:investment_id].nil? || params[:investment_id].empty?
    tags = tags.where("code = ?",  params[:tag_code] )unless params[:tag_code].nil? || params[:tag_code].empty?
    tags = tags.reject {|tag| tag.companies_count <= 1}  if tags.count > 0
    TagDecorator.decorate(tags.uniq)
  end

  def self.tags_for_cloud
    tags = Tag.scoped
    tags = tags.reject {|tag| tag.companies_count <= 1}
    TagDecorator.decorate(tags.uniq)
  end

end